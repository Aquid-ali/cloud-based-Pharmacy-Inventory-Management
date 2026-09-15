import React, { useEffect, useRef, useState } from 'react';
import { FiLoader, FiSearch } from 'react-icons/fi';
import { getAutocompleteSuggestions } from '../../services/medicineCatalogService';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const DEBOUNCE_MS = 250;

/**
 * Self-contained search input + live autocomplete dropdown. Owns its own
 * fetch/keyboard-nav/outside-click state; the wrapping <form> (ShopLayout's
 * navbar search) still handles a bare Enter submit exactly as before -
 * this component only intercepts Enter when a suggestion is highlighted.
 */
const SearchAutocomplete = ({ value, onChange, onSelectSuggestion, placeholder = 'Search...', inputClassName = '' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const wrapRef = useRef(null);
  const requestIdRef = useRef(0);
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS);

  useEffect(() => {
    const term = debouncedValue.trim();
    if (!term) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    getAutocompleteSuggestions({ q: term })
      .then(({ data }) => {
        if (requestId !== requestIdRef.current) return; // superseded by a newer request
        setSuggestions(data.data.suggestions);
        setHighlighted(-1);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [debouncedValue]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pick = (suggestion) => {
    setOpen(false);
    onChange(suggestion.name);
    onSelectSuggestion(suggestion.name);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      pick(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && value.trim().length > 0;

  return (
    <div className="relative" ref={wrapRef}>
      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 text-sm max-h-80 overflow-y-auto z-40">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-ink-faint">
              <FiLoader className="animate-spin" size={14} />
              Searching...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-ink-faint">No matches found</div>
          ) : (
            suggestions.map((s, i) => (
              <button
                key={s._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // keep focus so onClick still fires before blur closes the dropdown
                onClick={() => pick(s)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-4 py-2 flex flex-col ${i === highlighted ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
              >
                <span className="font-medium text-ink truncate">💊 {s.name}</span>
                {(s.genericName || s.manufacturer) && (
                  <span className="text-xs text-ink-faint truncate">
                    {[s.genericName, s.manufacturer].filter(Boolean).join(' • ')}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
