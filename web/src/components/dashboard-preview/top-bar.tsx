import { Bell, HelpCircle, Search } from "lucide-react";

export function TopBar() {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
      <div className="flex max-w-xs items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/40">
        <Search className="h-3.5 w-3.5" />
        Search
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent-pink" />
      </div>
    </div>
  );
}
