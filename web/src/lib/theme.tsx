"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import {
  DASHBOARD_THEME_COOKIE,
  DASHBOARD_THEME_COOKIE_PATH,
  parseDashboardTheme,
  type AppTheme,
} from "./dashboard-theme";

export type { AppTheme };

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The cookie is the store; listeners let every consumer re-render on a toggle.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readCookieTheme(): AppTheme {
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${DASHBOARD_THEME_COOKIE}=`));
  return parseDashboardTheme(entry?.slice(DASHBOARD_THEME_COOKIE.length + 1));
}

function writeCookieTheme(theme: AppTheme) {
  document.cookie = `${DASHBOARD_THEME_COOKIE}=${theme}; path=${DASHBOARD_THEME_COOKIE_PATH}; max-age=31536000; samesite=lax`;
  listeners.forEach((l) => l());
}

/**
 * Dashboard-only light/dark theme (the landing page is always dark and has no
 * provider). `initialTheme` comes from the dashboard layout reading the same
 * cookie on the server, so the first paint is already correct; after that
 * the cookie itself is read directly, which also keeps client-side
 * navigation back into the dashboard in sync with a toggle made earlier.
 */
export function ThemeProvider({ initialTheme, children }: { initialTheme: AppTheme; children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readCookieTheme, () => initialTheme);

  const toggleTheme = useCallback(() => {
    writeCookieTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {/* display:contents keeps this out of the layout while still scoping
          the --color-* overrides (globals.css) to every descendant. */}
      <div className={`contents ${theme === "light" ? "light-theme" : ""}`}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be called within a ThemeProvider");
  }
  return ctx;
}
