import { ArrowLeftRight, Bell, Coins, LayoutDashboard } from "lucide-react";
import { Logo } from "../logo";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Tokens", icon: Coins, active: false },
  { label: "Alerts", icon: Bell, active: false },
  { label: "Trade", icon: ArrowLeftRight, active: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-white/5 bg-[#0a0a0b] px-4 py-5 sm:block">
      <div className="flex items-center gap-2 px-2">
        <Logo className="h-6 w-6" />
        <span className="text-sm font-semibold text-white">Basis</span>
      </div>

      <p className="mt-6 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">General</p>

      <nav className="mt-2 space-y-1">
        {navItems.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
              active ? "bg-white/10 text-white" : "text-white/60"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
