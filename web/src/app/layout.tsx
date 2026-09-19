import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  weight: "400 700",
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Basis — Pre-IPO Tokens, Priced Right",
  description:
    "Basis tracks the live spread between Tessera's fair value and real DEX prices for T-OpenAI, T-Kalshi, and T-SpaceX.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
