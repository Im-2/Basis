import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { ProblemSolution } from "@/components/problem-solution";
import { SpreadChartPreview } from "@/components/spread-chart-preview";
import { WhyItMatters } from "@/components/why-it-matters";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <ProblemSolution />
      <SpreadChartPreview />
      <WhyItMatters />
    </main>
  );
}
