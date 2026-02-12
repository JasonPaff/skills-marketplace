'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';

const ACCENT_COLORS = ['blue', 'purple', 'green', 'rose', 'orange', 'teal'] as const;
type AccentColor = (typeof ACCENT_COLORS)[number];

interface AccentColorContextValue {
  accentColor: AccentColor;
  accentColors: readonly AccentColor[];
  setAccentColor: (color: AccentColor) => void;
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null);

const STORAGE_KEY = 'accent-color';
const DEFAULT_ACCENT: AccentColor = 'blue';

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULT_ACCENT);

  const updateAccentColor = useEffectEvent((color: AccentColor) => {
    setAccentColorState(color);
  });

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_COLORS.includes(stored as AccentColor)) {
      updateAccentColor(stored as AccentColor);
    }
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem(STORAGE_KEY, color);

    // Update DOM attribute
    if (color === DEFAULT_ACCENT) {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.dataset.accent = color;
    }
  }, []);

  // Sync DOM on mount / initial state
  useEffect(() => {
    if (accentColor === DEFAULT_ACCENT) {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.dataset.accent = accentColor;
    }
  }, [accentColor]);

  return (
    <AccentColorContext.Provider
      value={{ accentColor, accentColors: ACCENT_COLORS, setAccentColor }}
    >
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
  if (!ctx) throw new Error('useAccentColor must be used within AccentColorProvider');
  return ctx;
}
