import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const interTight = localFont({
  src: "./fonts/InterTight-Variable.woff2",
  weight: "400 600",
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Basis — Pre-IPO Tokens, Priced Right",
  description:
    "Basis tracks the live spread between Tessera's fair value and real DEX prices for T-OpenAI, T-Kalshi, and T-SpaceX.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={interTight.variable}>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
