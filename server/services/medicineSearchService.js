const Fuse = require('fuse.js');
const MedicineCatalog = require('../models/MedicineCatalog');
const { normalizeMedicineName } = require('../utils/normalizeMedicineName');

// Fields a query word must appear in (substring match) to enter the
// candidate pool at all - widened from the original searchMedicines/
// browsePharmacyInventory duplication to also include brandName.
const SEARCH_FIELDS = ['name', 'genericName', 'brandName', 'composition', 'manufacturer', 'uses'];
// findCandidatePool has no DB-level sort (Mongo returns whatever order it
// scans in), so this cap has to be generous enough that a real identity-field
// match is never silently dropped before ranking gets a chance to run - e.g.
// a 2-char query matching thousands of documents via incidental manufacturer-
// name substrings ("pa" -> "...Pharma...") must not push a genuine
// name-prefix match past the cutoff. ~11,500 total catalog docs at this
// compact a projection makes fetching a few thousand candidates cheap.
const CANDIDATE_POOL_CAP = 3000;

const MIN_FUZZY_QUERY_LENGTH = 3;
const FUZZY_BACKFILL_THRESHOLD = 5; // pool this size or larger -> skip fuzzy entirely
const FUZZY_MAX_SCORE = 0.45; // Fuse score above this is discarded outright
const DID_YOU_MEAN_MAX_SCORE = 0.3; // stricter cutoff, only checked when the pool is empty
const FUZZY_TIER = 9; // always ranks below every literal-match tier (1-8, see classifyTier)

const CACHE_TTL_MS = 7 * 60 * 1000;
// Small projection only - never the large free-text fields (description/uses/
// sideEffects/etc). This cache powers the autocomplete endpoint and the
// fuzzy tier, both of which only ever need name-shaped fields.
const CACHE_PROJECTION = '_id name normalizedName genericName brandName composition manufacturer strength dosageForm';

// The imported ~11,500-row catalog names medicines by BRAND (`name`, e.g.
// "Azithral 500 Tablet", "Augmentin 625 Duo Tablet") - `genericName` is
// populated on essentially none of them (2 of 11,497 at last count). The
// real active-ingredient text lives inside `composition`, often as several
// ingredients joined by "+" with a parenthesized dosage, e.g.
// "Amoxycillin (500mg) + Clavulanic Acid (125mg)". Fuzzy-matching a typo
// like "amoxcillin" against that whole 40+ character string as one unit
// scores poorly even though "Amoxycillin" is right there - so each
// ingredient is split out into its own short, clean token before indexing.
// This is also what lets the fuzzy tier bridge the dataset's Indian/BP
// ingredient spellings (e.g. "Amoxycillin") against a customer typing the
// more common US spelling ("Amoxicillin") - both cases are a single-letter
// difference, well within Fuse's edit-distance tolerance once compared as
// short, isolated tokens instead of buried in a long composite string.
const extractIngredientTokens = (composition) => {
  if (!composition) return [];
  return composition
    .split('+')
    .map((part) => normalizeMedicineName(part.replace(/\([^)]*\)/g, ' ')))
    .filter(Boolean);
};

// Deliberately a SINGLE array key rather than several weighted keys. Fuse's
// multi-key weighted mode blends a score across every key, which penalizes a
// document that matches one field extremely well but has unrelated text in
// the others (e.g. a document whose composition token is a near-perfect
// match for "paracetmol" still scored worse overall than one with only a
// mediocre match, because its *name* pulled the blended score down). Putting
// every candidate string - name, normalizedName, genericName, brandName, and
// each split-out ingredient token - into one array field means Fuse takes
// the single best-matching entry per document, which is the "does ANY
// identifying field resemble this query" semantics this feature actually
// wants.
const buildSearchTokens = (doc) =>
  [doc.name, doc.normalizedName, doc.genericName, doc.brandName, ...extractIngredientTokens(doc.composition)].filter(
    Boolean
  );

const FUSE_OPTIONS = {
  includeScore: true,
  isCaseSensitive: false,
  ignoreLocation: true,
  minMatchCharLength: 2,
  threshold: 0.4,
  distance: 100,
  keys: ['searchTokens'],
};

let cachedFuse = null;
let cachedDocs = null;
let cacheBuiltAt = 0;

// Lazy TTL refresh - the first request after expiry pays the rebuild cost, no
// background timer/interval needed. ~11,500 small records takes on the order
// of tens of milliseconds to index, so this is cheap even when it does fire.
// Returns both the Fuse index and the raw docs array (Fuse doesn't expose the
// indexed documents via public API, so the docs are cached alongside it).
const getFuseIndex = async () => {
  const isStale = !cachedFuse || Date.now() - cacheBuiltAt > CACHE_TTL_MS;
  if (isStale) {
    const raw = await MedicineCatalog.find({}, CACHE_PROJECTION).lean();
    cachedDocs = raw.map((doc) => ({
      ...doc,
      compositionTokens: extractIngredientTokens(doc.composition),
      searchTokens: buildSearchTokens(doc),
    }));
    cachedFuse = new Fuse(cachedDocs, FUSE_OPTIONS);
    cacheBuiltAt = Date.now();
  }
  return { fuse: cachedFuse, docs: cachedDocs };
};

const escapeRegex = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tiers 1-3 in a single Mongo query - every word of the query must match at
// least one of SEARCH_FIELDS (case-insensitive substring), same as the
// original searchMedicines/browsePharmacyInventory logic this replaces.
const findCandidatePool = async (q) => {
  const words = q.trim().split(/\s+/).filter(Boolean);
  const filter = {
    $and: words.map((word) => {
      const regex = new RegExp(escapeRegex(word), 'i');
      return { $or: SEARCH_FIELDS.map((field) => ({ [field]: regex })) };
    }),
  };
  return MedicineCatalog.find(filter, CACHE_PROJECTION).limit(CANDIDATE_POOL_CAP).lean();
};

const startsWithCI = (value, prefix) => Boolean(value) && value.toLowerCase().startsWith(prefix.toLowerCase());
const containsCI = (value, needle) => Boolean(value) && value.toLowerCase().includes(needle.toLowerCase());
const equalsCI = (value, other) => Boolean(value) && value.toLowerCase() === other.toLowerCase();

/**
 * Classifies a candidate into a numeric rank, lower is more relevant. Beyond
 * the spec's basic exact/prefix/contains/fuzzy priorities, this also
 * distinguishes a SINGLE-ingredient product (composition is just that one
 * active ingredient) from a multi-ingredient combo that merely contains it
 * among others - e.g. searching "paracetamol" should rank a pure paracetamol
 * brand above an aceclofenac+paracetamol combo tablet, even though both
 * technically contain the ingredient the user searched for. It also keeps a
 * real product-identity match (brand/ingredient) ahead of a match that only
 * exists because the query happened to appear inside a manufacturer name or
 * the `uses` text (almost any "pa" query substring-matches "...Pharma..." in
 * half this dataset's manufacturers - a real but weak signal, not what the
 * user meant).
 */
const classifyTier = (doc, rawQuery, normQuery) => {
  const tokens = doc.compositionTokens || extractIngredientTokens(doc.composition);
  const isSingleIngredient = tokens.length === 1;
  const tokenEquals = tokens.some((t) => t === normQuery);
  const tokenStartsWith = tokens.some((t) => t.startsWith(normQuery));
  const tokenContains = tokens.some((t) => t.includes(normQuery));

  const nameFieldEquals =
    doc.normalizedName === normQuery ||
    equalsCI(doc.name, rawQuery) ||
    equalsCI(doc.genericName, rawQuery) ||
    equalsCI(doc.brandName, rawQuery);
  const nameFieldStartsWith =
    (doc.normalizedName || '').startsWith(normQuery) ||
    startsWithCI(doc.name, rawQuery) ||
    startsWithCI(doc.genericName, rawQuery) ||
    startsWithCI(doc.brandName, rawQuery);
  const nameFieldContains =
    containsCI(doc.name, rawQuery) || containsCI(doc.genericName, rawQuery) || containsCI(doc.brandName, rawQuery);

  if (nameFieldEquals) return 1;
  if (tokenEquals && isSingleIngredient) return 2;
  if (tokenEquals) return 3; // exact ingredient match within a multi-ingredient combo
  if (nameFieldStartsWith) return 4;
  if (tokenStartsWith) return 5;
  if (nameFieldContains) return 6;
  if (tokenContains) return 7;
  return 8; // only matched via manufacturer/uses/raw composition text
};

/**
 * Ranks the catalog against a (possibly empty) query. Returns null
 * orderedIds when q is empty so callers can preserve their existing
 * "browse everything" behavior unchanged.
 */
async function rankCatalogMatches({ q }) {
  const rawQuery = (q || '').trim();
  if (!rawQuery) {
    return { orderedIds: null, suggestion: null };
  }

  const normQuery = normalizeMedicineName(rawQuery);
  const pool = await findCandidatePool(rawQuery);

  const ranked = pool
    .map((doc) => ({ doc, tier: classifyTier(doc, rawQuery, normQuery) }))
    .sort((a, b) => a.tier - b.tier || a.doc.name.localeCompare(b.doc.name));

  let suggestion = null;

  // Every pool item is already classified into tier 1-8 (a real literal
  // match on some field) - only fuzzy additions ever get FUZZY_TIER, so the
  // pool's own size is exactly the "how many real matches already exist"
  // count the backfill/suggestion gating needs.
  const shouldRunFuzzy = normQuery.length >= MIN_FUZZY_QUERY_LENGTH && pool.length < FUZZY_BACKFILL_THRESHOLD;
  if (shouldRunFuzzy) {
    const { fuse } = await getFuseIndex();
    const poolIds = new Set(pool.map((doc) => String(doc._id)));
    const fuzzyHits = fuse
      .search(normQuery)
      .filter((hit) => hit.score <= FUZZY_MAX_SCORE && !poolIds.has(String(hit.item._id)));

    fuzzyHits.forEach((hit) => ranked.push({ doc: hit.item, tier: FUZZY_TIER }));

    if (pool.length === 0 && fuzzyHits.length > 0 && fuzzyHits[0].score <= DID_YOU_MEAN_MAX_SCORE) {
      suggestion = { text: fuzzyHits[0].item.name, medicineId: fuzzyHits[0].item._id };
    }
  }

  return { orderedIds: ranked.map((r) => String(r.doc._id)), suggestion };
}

/**
 * Adds pagination on top of rankCatalogMatches - used by searchMedicines.
 * An empty query preserves the original "browse everything" behavior
 * exactly: DB-level alphabetical pagination over the full catalog, not the
 * ranking/fuzzy path (which only makes sense once there's a query to rank
 * against).
 */
async function searchCatalog({ q, page = 1, limit = 20 }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const rawQuery = (q || '').trim();
  if (!rawQuery) {
    const [docs, total] = await Promise.all([
      MedicineCatalog.find({}, '_id').sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      MedicineCatalog.countDocuments({}),
    ]);
    return { ids: docs.map((d) => String(d._id)), total, suggestion: null, page: pageNum, limit: limitNum };
  }

  const { orderedIds, suggestion } = await rankCatalogMatches({ q: rawQuery });
  return {
    ids: orderedIds.slice(skip, skip + limitNum),
    total: orderedIds.length,
    suggestion,
    page: pageNum,
    limit: limitNum,
  };
}

/**
 * Cache-only autocomplete - never touches Mongo per request. Searches
 * brand name, generic name, and (crucially, given this dataset - see the
 * comment on extractIngredientTokens above) individual active-ingredient
 * tokens, so typing a generic/ingredient name surfaces the brand-name
 * products that actually contain it.
 */
async function getAutocompleteSuggestions({ q, limit = 8 }) {
  const rawQuery = (q || '').trim();
  if (!rawQuery) return [];

  const normQuery = normalizeMedicineName(rawQuery);
  const { fuse, docs: allDocs } = await getFuseIndex();

  const substringMatches = allDocs.filter((doc) => {
    const haystacks = [doc.name, doc.genericName, doc.brandName, doc.normalizedName];
    if (haystacks.some((h) => h && h.toLowerCase().includes(rawQuery.toLowerCase()))) return true;
    return (doc.compositionTokens || []).some((t) => t.includes(normQuery));
  });

  const ranked = substringMatches
    .map((doc) => ({ doc, tier: classifyTier(doc, rawQuery, normQuery) }))
    .sort((a, b) => a.tier - b.tier || a.doc.name.localeCompare(b.doc.name));

  if (normQuery.length >= MIN_FUZZY_QUERY_LENGTH && ranked.length < FUZZY_BACKFILL_THRESHOLD) {
    const seenIds = new Set(ranked.map((r) => String(r.doc._id)));
    const fuzzyHits = fuse
      .search(normQuery)
      .filter((hit) => hit.score <= FUZZY_MAX_SCORE && !seenIds.has(String(hit.item._id)));
    fuzzyHits.forEach((hit) => ranked.push({ doc: hit.item, tier: FUZZY_TIER }));
  }

  const capped = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 8);
  return ranked.slice(0, capped).map(({ doc }) => ({
    _id: doc._id,
    name: doc.name,
    genericName: doc.genericName || '',
    manufacturer: doc.manufacturer || '',
  }));
}

module.exports = { rankCatalogMatches, searchCatalog, getAutocompleteSuggestions };
