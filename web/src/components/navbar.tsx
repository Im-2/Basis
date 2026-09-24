"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";

// In page order. Section links smooth-scroll (globals.css); the sections carry
// scroll-margin so the fixed nav doesn't cover their headings.
const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Basis", href: "#why-basis" },
  { label: "Live Data", href: "#live-data" },
  { label: "Markets", href: "/dashboard/markets" },
];

function NavLink({ label, href, onClick, className }: { label: string; href: string; onClick?: () => void; className: string }) {
  return href.startsWith("#") ? (
    <a href={href} onClick={onClick} className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} onClick={onClick} className={className}>
      {label}
    </Link>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="relative flex w-full max-w-6xl items-center justify-between gap-6 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-lg shadow-black/40 backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Logo className="h-6 w-6" />
          <span className="text-base font-semibold tracking-tight text-white">Basis</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.label} {...link} className="text-sm text-white/70 transition hover:text-white" />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="btn-primary rounded-full px-5 py-2 text-sm font-medium transition">
            Launch App
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:text-white md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 top-full mt-2 rounded-2xl border border-white/10 bg-[#141416] p-2 shadow-lg shadow-black/60 md:hidden">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                {...link}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
              />
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
