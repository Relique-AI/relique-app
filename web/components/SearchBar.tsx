"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  initialQ?: string;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ initialQ = "", placeholder = "Rechercher…", className = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/market?${params.toString()}`);
  }

  function clear() {
    setQ("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/market?${params.toString()}`);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={submit} className={`relative flex items-center ${className}`}>
      <div className="absolute left-4 text-text-muted pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-full pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
      />
      {q && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-10 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
      <button
        type="submit"
        className="absolute right-3 text-text-muted hover:text-primary transition-colors"
        aria-label="Rechercher"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </form>
  );
}
