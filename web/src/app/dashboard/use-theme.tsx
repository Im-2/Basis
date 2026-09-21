"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type DashboardTheme = "light" | "dark";

const STORAGE_KEY = "basis-dashboard-theme";

interface ThemeContextValue {
  theme: DashboardTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Dashboard-only light/dark toggle, persisted to localStorage. Defaults to
 * "light" to match the current SSR markup (avoids a hydration mismatch);
 * a stored preference is applied a beat after mount, same tradeoff every
 * localStorage-backed theme toggle makes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<DashboardTheme>("light");
  // Guards the persist-effect below from writing the default "light" value
  // back over a real stored preference before the read-effect has run --
  // without this, mount order is: read schedules a microtask, write-effect
  // fires synchronously with the still-default state and clobbers storage,
  // and only then does the read's microtask fire (reading what it just
  // overwrote).
  const hydrated = useRef(false);

  useEffect(() => {
    // Deferred a tick (rather than calling setTheme synchronously in the effect
    // body) so this reads as an external-system subscription callback, not a
    // cascading render trigger -- the one-frame delay is invisible in practice.
    queueMicrotask(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setTheme(stored);
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be called within a ThemeProvider");
  }
  return ctx;
}
