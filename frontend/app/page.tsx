import { Hero } from "@/components/landing/hero";
import { AiSwapAgentCard } from "@/components/landing/ai-swap-agent-card";
import { Navbar } from "@/components/landing/navbar";
import { OhlcChart } from "@/components/landing/ohlc-chart";
import { SwapCard } from "@/components/landing/swap-card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <section id="swap" className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-8 backdrop-blur-sm">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="text-gradient-cyan">SmartSwap</span> <span className="text-white">Volatility Guard</span>
          </h2>
          <p className="mt-2 text-slate-300">Siguiente paso: conectar esta sección con la lógica WRBTC → DoC.</p>
          <OhlcChart />
          <SwapCard />
          <AiSwapAgentCard />
          
        </div>
      </section>
    </main>
  );
}
