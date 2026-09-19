import { TrendingDown, TrendingUp, Users } from "lucide-react";
import type { ComponentType } from "react";
import type { HeroStat } from "@/lib/dashboard-data";
import { KalshiIcon, OpenAIIcon, SpaceXIcon } from "@/components/token-icons";

const iconMap: Record<HeroStat["icon"], ComponentType<{ className?: string }>> = {
  openai: OpenAIIcon,
  kalshi: KalshiIcon,
  spacex: SpaceXIcon,
  holders: Users,
};

export function StatCard({ label, value, trend, trendLabel, icon }: Omit<HeroStat, "key">) {
  const Icon = iconMap[icon];
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-white/80" />
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs ${trend === "up" ? "text-white/80" : "text-muted"}`}>
        <TrendIcon className="h-3 w-3" />
        {trendLabel}
      </p>
    </div>
  );
}
