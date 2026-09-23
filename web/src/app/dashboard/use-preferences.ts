"use client";

import { useEffect, useRef, useState } from "react";

export const PREFERENCE_TOKENS = ["T-OpenAI", "T-Kalshi", "T-SpaceX"] as const;
export const PREFERENCE_TIMEFRAMES = ["6H", "24H", "7D", "All"] as const;

export type PreferenceToken = (typeof PREFERENCE_TOKENS)[number];
export type PreferenceTimeframe = (typeof PREFERENCE_TIMEFRAMES)[number];

export interface Preferences {
  defaultToken: PreferenceToken;
  defaultTimeframe: PreferenceTimeframe;
  alertsEnabled: boolean;
  alertThresholdPct: number;
}

const DEFAULTS: Preferences = {
  defaultToken: "T-OpenAI",
  defaultTimeframe: "24H",
  alertsEnabled: true,
  alertThresholdPct: 25,
};

const STORAGE_KEY = "basis-preferences";

function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.defaultToken === "string" &&
    typeof v.defaultTimeframe === "string" &&
    typeof v.alertsEnabled === "boolean" &&
    typeof v.alertThresholdPct === "number"
  );
}

/**
 * Dashboard-wide preferences (default token/timeframe, alert threshold),
 * persisted to localStorage. Same hydration-race guard as the theme hook
 * (lib/theme.tsx): defaults render on the server/first paint, the real
 * stored value applies a beat after mount, and a `hydrated` ref stops the
 * persist-effect from clobbering storage with that default in between.
 */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const hydrated = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isPreferences(parsed)) setPrefs(parsed);
        }
      } catch {
        // ignore malformed/blocked storage -- defaults stand
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore blocked storage (e.g. private browsing)
    }
  }, [prefs]);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  return { prefs, update };
}
