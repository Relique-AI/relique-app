"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/market?q=${encodeURIComponent(term)}`);
    setOpen(false);
    setQ("");
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); setQ(""); }
  }

  return (
    <div className="relative hidden md:block">
      {open ? (
        <form onSubmit={submit} className="flex items-center">
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => { if (!q) setOpen(false); }}
            placeholder="Rechercher…"
            className="w-48 bg-surface border border-border rounded-full pl-4 pr-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-all"
          />
          <button type="submit" className="absolute right-2.5 text-text-muted hover:text-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          aria-label="Rechercher"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      )}
    </div>
  );
}
