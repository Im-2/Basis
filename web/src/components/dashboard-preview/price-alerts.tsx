import type { PriceAlert } from "@/lib/types";

const toneStyles: Record<PriceAlert["tone"], string> = {
  premium: "bg-accent",
  discount: "bg-accent-pink",
  neutral: "bg-white/40",
};

export function PriceAlerts({ alerts }: { alerts: PriceAlert[] }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">Price Alerts</p>
      <div className="mt-4 space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${toneStyles[alert.tone]}`} />
            <div className="min-w-0">
              <p className="text-sm leading-snug text-white/90">{alert.message}</p>
              <p className="mt-0.5 text-xs text-muted">{alert.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
