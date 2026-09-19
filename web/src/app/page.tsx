import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { ProblemSolution } from "@/components/problem-solution";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ProblemSolution />
    </main>
  );
}
