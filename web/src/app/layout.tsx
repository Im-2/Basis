import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  weight: "400 700",
  variable: "--font-geist",
  display: "swap",
});

const title = "Basis: Pre-IPO Tokens, Priced Right";
const description =
  "Basis tracks the live spread between Tessera's fair value and real DEX prices for T-OpenAI, T-Kalshi, and T-SpaceX.";

// The icon, apple-icon, opengraph-image and twitter-image files in app/ add
// their own tags; metadataBase makes those image URLs absolute for X and co.
export const metadata: Metadata = {
  metadataBase: new URL("https://basis-spread.vercel.app"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Basis",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@nuelcrypt",
  },
};

// No theme provider here: the landing page is always dark (the CSS defaults),
// and the dashboard layout provides its own light/dark theme.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
