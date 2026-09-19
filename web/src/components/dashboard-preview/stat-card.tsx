import { Percent, TrendingDown, TrendingUp, Users, type LucideIcon } from "lucide-react";
import type { HeroStat } from "@/lib/dashboard-data";

const iconMap: Record<HeroStat["icon"], LucideIcon> = {
  spread: Percent,
  holders: Users,
};

export function StatCard({ label, value, trend, trendLabel, icon }: Omit<HeroStat, "key">) {
  const Icon = iconMap[icon];
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
        <Icon className="h-4 w-4 text-white/70" />
      </div>
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs ${trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
        <TrendIcon className="h-3 w-3" />
        {trendLabel}
      </p>
    </div>
  );
}
