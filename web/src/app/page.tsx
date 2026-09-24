import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { ProblemSolution } from "@/components/problem-solution";
import { SiteFooter } from "@/components/site-footer";
import { SpreadChartPreview } from "@/components/spread-chart-preview";
import { TradeCTA } from "@/components/trade-cta";
import { WhyItMatters } from "@/components/why-it-matters";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen bg-background">
      {/* -z-10 inside the isolated <main>: above main's own background, below every section. */}
      <div aria-hidden className="landing-dots pointer-events-none absolute inset-0 -z-10" />
      <Navbar />
      <Hero />
      <HowItWorks />
      <ProblemSolution />
      <SpreadChartPreview />
      <WhyItMatters />
      <TradeCTA />
      <SiteFooter />
    </main>
  );
}
