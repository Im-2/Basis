import { heroStats, priceAlerts, spreadHistory, spreadHistorySymbol } from "@/lib/dashboard-data";
import { PriceAlerts } from "./price-alerts";
import { Sidebar } from "./sidebar";
import { SpreadHistoryChart } from "./spread-history-chart";
import { StatCard } from "./stat-card";
import { TopBar } from "./top-bar";

/**
 * The hero's live dashboard mockup inside a CSS-only MacBook Air (front view).
 * Every frame dimension is in cqw of the device width, so the whole thing
 * scales proportionally; the screen contents are the real components.
 */
export function DashboardPreview() {
  return (
    <div className="@container relative">
      {/* Lid: thin black bezel inside an aluminum rim. */}
      <div className="laptop-lid relative mx-auto w-[86cqw] rounded-t-[2.2cqw] rounded-b-[0.3cqw] p-[1cqw]">
        {/* Screen: light, contrasting with the always-dark landing page. */}
        <div className="light-theme relative aspect-[1.55] overflow-hidden rounded-t-[0.9cqw] rounded-b-[0.2cqw] bg-background">
          {/* Starts a menu-bar-height band below the top, so the notch never covers the dashboard's top bar. */}
          <div className="absolute inset-x-0 bottom-0 top-[1.5cqw] overflow-hidden">
            <div className="laptop-screen-content flex">
              <Sidebar />

              <div className="min-w-0 flex-1 overflow-hidden">
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
          </div>

          {/* Content fades into the screen's own color; the device itself stays fully visible. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-background"
          />

          {/* Camera notch, cut down from the top bezel over the screen, above everything. */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 z-10 flex h-[1.4cqw] w-[10.5cqw] -translate-x-1/2 items-center justify-center rounded-b-[0.7cqw] bg-[#0a0a0c]"
          >
            <span className="laptop-lens h-[0.45cqw] min-h-[2px] w-[0.45cqw] min-w-[2px] rounded-full" />
          </div>
        </div>
      </div>

      {/* Hinge band below the bottom bezel. Overlaps the lid by the rim's width so the rim wraps
          the top and sides but not the bottom edge, like the real thing. */}
      <div
        aria-hidden
        className="laptop-hinge relative mx-auto -mt-[max(1px,0.2cqw)] h-[1.3cqw] w-[86cqw] rounded-b-[0.25cqw]"
      />

      {/* Base: full device width, thumb scoop at the front edge, rubber feet underneath. */}
      <div aria-hidden className="laptop-base relative h-[1.9cqw] rounded-t-[0.35cqw] rounded-b-[1.3cqw]">
        <span className="laptop-scoop absolute left-1/2 top-0 h-[55%] w-[16%] -translate-x-1/2 rounded-b-[0.8cqw]" />
        <span className="laptop-foot absolute left-[3%] top-full h-[0.45cqw] w-[7%] rounded-b-full" />
        <span className="laptop-foot absolute right-[3%] top-full h-[0.45cqw] w-[7%] rounded-b-full" />
      </div>
    </div>
  );
}
