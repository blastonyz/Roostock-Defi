"use client";

import { ArrowRight } from "lucide-react";
import LiquidSphere from "@/components/ui/LiquidSphere";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute right-1/4 top-1/3 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            <span className="text-xs uppercase tracking-wider text-cyan-300">Rootstock Testnet Live</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-gradient-cyan">Sovryn Swap</span>
            <br />
            <span>on Rootstock</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Fast WRBTC → DoC swaps with a clean DeFi interface. Connected to your private RPC and ready for demo flow.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#swap"
              className="btn-gradient-cyan group inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold text-slate-950 transition-all"
            >
              Open Swap
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#docs"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-slate-900/70 px-7 py-3.5 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-300/60 hover:text-cyan-100"
            >
              View Docs
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-cyan-500/15 blur-[70px]" />
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-blue-500/10 blur-[120px]" />
            <LiquidSphere />
          </div>
        </div>
      </div>
    </section>
  );
}
