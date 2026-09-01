/**
 * Thin, swappable wrapper around whichever AI provider does medicine
 * enrichment. Today this only implements Anthropic (Claude), but every call
 * site talks to the functions exported here - not to the Anthropic SDK
 * directly - so a second provider could be added by branching on
 * AI_PROVIDER and implementing the same enrichMedicineInfo() contract.
 *
 * Configuration (all via environment variables, never hardcoded):
 *   AI_PROVIDER          - defaults to 'anthropic' (only implemented provider today)
 *   ANTHROPIC_API_KEY    - required for the 'anthropic' provider
 *   AI_MODEL              - defaults to 'claude-opus-5'
 */

const Anthropic = require('@anthropic-ai/sdk');
const { z } = require('zod');
const { betaZodOutputFormat } = require('@anthropic-ai/sdk/helpers/beta/zod');

const AI_PROVIDER = process.env.AI_PROVIDER || 'anthropic';
const AI_MODEL = process.env.AI_MODEL || 'claude-opus-5';

// --- Structured response contract -----------------------------------------
// Every field the AI can fill is nullable rather than optional, so the model
// must explicitly say "I don't know" (null) instead of silently omitting a
// field - that's what lets us tell "genuinely unknown" apart from "the model
// forgot to answer".
const EnrichmentResultSchema = z.object({
  identified: z.boolean(),
  confidence: z.number().min(0).max(100),
  reason: z.string().nullable(),
  genericName: z.string().nullable(),
  brandName: z.string().nullable(),
  composition: z.array(z.string()).nullable(),
  strength: z.string().nullable(),
  dosageForm: z.string().nullable(),
  description: z.string().nullable(),
  uses: z.array(z.string()).nullable(),
  howItWorks: z.string().nullable(),
  sideEffects: z.array(z.string()).nullable(),
  precautions: z.array(z.string()).nullable(),
  contraindications: z.array(z.string()).nullable(),
  storage: z.string().nullable(),
  prescriptionRequired: z.boolean().nullable(),
});

const SYSTEM_PROMPT = `You are a pharmaceutical reference-data assistant for a pharmacy inventory system. Your ONLY job is to identify a medicine from its name (and any other supplied context) and, if you can identify it with reasonable confidence, provide standard, well-established reference information about it - the kind of general information found in a drug formulary or package insert.

You are NOT a prescriber and must NEVER give personalized medical advice, diagnose, recommend a specific patient dosage, or tell anyone whether they personally should take this medicine. "uses" and "howItWorks" should describe the medicine/drug class in general terms (what condition(s) it treats, its general mechanism of action) - never instructions directed at an individual reader. "storage" should be general reference-level guidance (e.g. typical temperature/light/moisture handling for that dosage form), not household-specific instructions.

Critical rules:
1. If the given name is ambiguous, could refer to multiple different real products, doesn't correspond to any real/known medicine, or you are not reasonably confident in the identification, set identified=false and confidence below 50, explain briefly in "reason", and set every other field to null. Do NOT guess or invent information to fill the fields anyway.
2. Only report information you have genuine, reasonably reliable knowledge of. If you can identify the medicine but are unsure of a specific field (e.g. exact composition ratio, or prescriptionRequired status), leave that specific field null rather than guessing - identified/confidence describe the medicine as a whole, not each individual field.
3. A supplied "manufacturer" may be inaccurate or informal (e.g. a small local pharmacy's own label rather than the actual originator). If the medicine name itself clearly matches a real, well-known generic drug or product, you may still identify it with moderate-to-high confidence based on the name/composition/strength even if the manufacturer looks unreliable - just don't let a plausible-sounding but unverifiable manufacturer inflate your confidence in an otherwise-unidentifiable name.
4. Respond with ONLY the structured JSON output - no extra commentary.`;

function buildUserMessage(medicine) {
  const lines = [`Medicine name: ${medicine.name}`];
  if (medicine.manufacturer) lines.push(`Manufacturer (as recorded by the pharmacy): ${medicine.manufacturer}`);
  if (medicine.genericName) lines.push(`Generic name (already on file): ${medicine.genericName}`);
  if (medicine.dosageForm) lines.push(`Dosage form (already on file): ${medicine.dosageForm}`);
  if (medicine.composition) lines.push(`Composition (already on file): ${medicine.composition}`);
  lines.push('', 'Identify this medicine and provide the structured reference information described in your instructions.');
  return lines.join('\n');
}

function isConfigured() {
  if (AI_PROVIDER !== 'anthropic') return false;
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let cachedClient = null;
function getClient() {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

/**
 * Calls the configured AI provider to identify + enrich one medicine.
 * Never throws - every failure mode (missing config, network error, rate
 * limit, malformed/unvalidatable response) resolves to { ok: false, reason },
 * so a bulk enrichment loop can always continue to the next medicine.
 *
 * @param {{ name: string, manufacturer?: string, genericName?: string, dosageForm?: string, composition?: string }} medicine
 * @returns {Promise<{ ok: true, data: object, confidence: number, identified: boolean, source: string } | { ok: false, reason: string }>}
 */
async function enrichMedicineInfo(medicine) {
  if (!isConfigured()) {
    return { ok: false, reason: 'AI provider is not configured (set ANTHROPIC_API_KEY)' };
  }

  const client = getClient();

  let response;
  try {
    response = await client.beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 8192,
      thinking: { type: 'enabled', budget_tokens: 2048 },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(medicine) }],
      output_format: betaZodOutputFormat(EnrichmentResultSchema),
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, reason: 'AI provider authentication failed (check ANTHROPIC_API_KEY)' };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, reason: 'AI provider rate limit exceeded' };
    }
    if (error instanceof Anthropic.BadRequestError) {
      return { ok: false, reason: `AI provider rejected the request: ${error.message}` };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, reason: 'AI provider (external medicine information service) unavailable' };
    }
    if (error instanceof Anthropic.APIError) {
      return { ok: false, reason: `AI provider error: ${error.message}` };
    }
    // Includes the AnthropicError thrown by betaZodOutputFormat's parse() when
    // the model's output doesn't validate against the schema.
    return { ok: false, reason: `AI response validation failed: ${error.message}` };
  }

  if (response.stop_reason === 'refusal') {
    return { ok: false, reason: 'AI provider declined to respond for this request' };
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    return { ok: false, reason: 'AI response validation failed: no structured output returned' };
  }

  return {
    ok: true,
    data: parsed,
    confidence: parsed.confidence,
    identified: parsed.identified,
    source: `ai:${AI_MODEL}`,
  };
}

module.exports = { isConfigured, enrichMedicineInfo, EnrichmentResultSchema, AI_MODEL, AI_PROVIDER };
