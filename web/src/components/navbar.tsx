import Link from "next/link";
import { Logo } from "./logo";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tokens", href: "#tokens" },
  { label: "Docs", href: "#docs" },
];

export function Navbar() {
  return (
    <header className="relative z-20 w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight text-white">Basis</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-white/70 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#app"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          Launch App
        </a>
      </nav>
    </header>
  );
}
