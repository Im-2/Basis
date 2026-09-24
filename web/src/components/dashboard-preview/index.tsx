"use client";

import { heroStats, priceAlerts, spreadHistory, spreadHistorySymbol } from "@/lib/dashboard-data";
import { useInvertedThemeClass } from "@/lib/theme";
import { PriceAlerts } from "./price-alerts";
import { Sidebar } from "./sidebar";
import { SpreadHistoryChart } from "./spread-history-chart";
import { StatCard } from "./stat-card";
import { TopBar } from "./top-bar";

/** The hero's live dashboard mockup, framed as a MacBook (CSS only -- the screen contents are the real components). */
export function DashboardPreview() {
  const invertedTheme = useInvertedThemeClass();

  return (
    <div className="relative">
      {/* Lid: black bezel (thicker at the top, for the camera) around the screen. */}
      <div className="laptop-lid relative rounded-t-[14px] rounded-b-[4px] p-[5px] pt-[9px] sm:rounded-t-[26px] sm:p-3 sm:pt-[18px]">
        <span
          aria-hidden
          className="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-[#1c1d21] ring-1 ring-[#2a2b30] sm:top-[7px] sm:h-1.5 sm:w-1.5"
        />

        {/* Screen: always the opposite of the page theme. Solid, not glass -- it's a display. */}
        <div
          className={`relative max-h-[215px] overflow-hidden rounded-t-[8px] rounded-b-[2px] bg-background sm:max-h-none sm:rounded-t-[14px] ${invertedTheme}`}
        >
          <div className="flex">
            <Sidebar />

            <div className="min-w-0 flex-1">
              <TopBar />

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {heroStats.map(({ key, ...stat }) => (
                    <StatCard key={key} {...stat} />
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <SpreadHistoryChart data={spreadHistory} symbol={spreadHistorySymbol} />
                  </div>
                  <PriceAlerts alerts={priceAlerts} />
                </div>
              </div>
            </div>
          </div>

          {/* The content fades into the screen's own color, so the bezel and base stay fully visible. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-background"
          />
        </div>
      </div>

      {/* Base: slightly wider than the lid, with the thumb indent where the lid opens. */}
      <div className="laptop-base relative -mx-[3%] h-[10px] rounded-b-[10px] rounded-t-[2px] sm:h-[18px] sm:rounded-b-[22px]">
        <span aria-hidden className="laptop-notch absolute left-1/2 top-0 h-1/2 w-[14%] -translate-x-1/2 rounded-b-[6px]" />
      </div>
    </div>
  );
}
