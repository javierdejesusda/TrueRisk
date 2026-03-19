'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PROVINCES, type ProvinceInfo } from '@/lib/provinces';

interface ProvinceSearchProps {
  onSelect: (province: ProvinceInfo) => void;
}

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function ProvinceSearch({ onSelect }: ProvinceSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() =>
    query.length > 0
      ? PROVINCES.filter(p => normalize(p.name).includes(normalize(query))).slice(0, 8)
      : [],
    [query],
  );

  const prevQueryRef = useRef(query);
  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    if (activeIndex !== 0) setActiveIndex(0);
  }

  const handleSelect = useCallback((province: ProvinceInfo) => {
    onSelect(province);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }, [onSelect]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }, [results, activeIndex, handleSelect]);

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-64">
      <div className="glass-heavy rounded-lg">
        <div className="relative flex items-center">
          <svg className="absolute left-2.5 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search province..."
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent py-2 pl-8 pr-8 text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-2.5 text-text-muted hover:text-text-secondary cursor-pointer"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {open && results.length > 0 && (
        <div ref={listRef} className="glass-heavy rounded-lg mt-1 overflow-hidden max-h-64 overflow-y-auto">
          {results.map((province, i) => (
            <button
              key={province.code}
              onMouseDown={() => handleSelect(province)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                i === activeIndex ? 'bg-accent-primary/15 text-text-primary' : 'text-text-secondary hover:bg-bg-card-hover'
              }`}
            >
              {province.name}
              <span className="ml-2 text-[10px] text-text-muted font-mono">{province.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
