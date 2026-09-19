import { heroStats, priceAlerts, spreadHistory, spreadHistorySymbol } from "@/lib/dashboard-data";
import { PriceAlerts } from "./price-alerts";
import { Sidebar } from "./sidebar";
import { SpreadHistoryChart } from "./spread-history-chart";
import { StatCard } from "./stat-card";
import { TopBar } from "./top-bar";

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="glass-panel mask-fade-bottom overflow-hidden rounded-2xl">
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
      </div>
    </div>
  );
}
