"use client";

import { useEffect, useState } from "react";
import type { DashboardApiResponse } from "@/lib/dashboard-api-types";

const REFRESH_MS = 30_000;

/** Polls /api/dashboard on a shared 30s interval; used by both the Overview and Trade pages. */
export function useDashboardData() {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        const json = (await res.json()) as DashboardApiResponse;
        if (cancelled) return;
        setData(json);
        setFetchError(null);
        setNow(Date.now());
      } catch {
        if (cancelled) return;
        setFetchError("Could not reach the dashboard API.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    data,
    spreads: data?.spreads ?? [],
    history: data?.history ?? [],
    fetchError,
    loading,
    now,
  };
}
