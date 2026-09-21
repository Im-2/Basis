import Link from "next/link";
import { Logo } from "./logo";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Docs", href: "#docs" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex w-full max-w-6xl items-center justify-between gap-6 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 shadow-lg shadow-black/40 backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="text-base font-semibold tracking-tight text-white">Basis</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-white/70 transition hover:text-white">
              {link.label}
            </a>
          ))}
          <Link href="/dashboard/markets" className="text-sm text-white/70 transition hover:text-white">
            Tokens
          </Link>
        </div>

        <Link href="/dashboard" className="btn-primary rounded-full px-5 py-2 text-sm font-medium transition">
          Launch App
        </Link>
      </nav>
    </header>
  );
}
