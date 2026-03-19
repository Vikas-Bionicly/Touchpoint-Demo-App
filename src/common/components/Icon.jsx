import { useMemo } from 'react';

export default function Icon({ name, className = '' }) {
  const icons = useMemo(
    () => ({
      sparkles: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3z" />
        </svg>
      ),
      addressCard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="11" r="2" />
          <path d="M14 10h4M14 14h4M6.5 15.5c.7-.9 1.7-1.5 3-1.5" />
        </svg>
      ),
      buildings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M5 21V7l7-4v18M19 21V11l-7-4" />
        </svg>
      ),
      list: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 7h13M8 12h13M8 17h13M3 7h.01M3 12h.01M3 17h.01" />
        </svg>
      ),
      handshake: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 12.5l2.5 2.5a2 2 0 0 0 2.8 0l3.7-3.7a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0l-2.5 2.5-1.2-1.2a2 2 0 0 0-2.8 0L5 10.2a2 2 0 0 0 0 2.8l3.7 3.7a2 2 0 0 0 2.8 0" />
        </svg>
      ),
      search: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      ),
      sliders: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16M9 6v3M15 12v3M7 18v3" />
        </svg>
      ),
      more: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      ),
      note: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3H6a2 2 0 0 0-2 2v14l4-3h10a2 2 0 0 0 2-2V8z" />
        </svg>
      ),
      target: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      chart: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16M7 16v-5M12 16V8M17 16v-3" />
        </svg>
      ),
      send: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4z" />
        </svg>
      ),
      chevron: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      ),
      switch: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10l-3-3" />
          <path d="M17 17H7l3 3" />
        </svg>
      ),
      signal: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="14" width="3" height="7" rx="1" />
          <rect x="8" y="11" width="3" height="10" rx="1" opacity="0.85" />
          <rect x="13" y="8" width="3" height="13" rx="1" opacity="0.7" />
          <rect x="18" y="5" width="3" height="16" rx="1" opacity="0.4" />
        </svg>
      ),
      settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      ),
      docPlus: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3H7a2 2 0 0 0-2 2v14l4-3h8a2 2 0 0 0 2-2V8z" />
          <path d="M16 17h6M19 14v6" />
        </svg>
      ),
      listPlus: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h10M4 12h10M4 18h10" />
          <path d="M18 12h4M20 10v4" />
        </svg>
      ),
      menu: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
      ),
      x: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6l12 12" />
          <path d="M18 6l-12 12" />
        </svg>
      ),
    }),
    []
  );

  return <span className={`icon ${className}`}>{icons[name] || null}</span>;
}
