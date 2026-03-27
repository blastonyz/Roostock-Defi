"use client";

import { useEffect, useMemo, useState } from "react";
import { useSovryn } from "@/contexts/sovryn-context";

export function SwapCard() {
  const [mounted, setMounted] = useState(false);
  const {
    isConnected,
    isSupportedChain,
    balances,
    balanceLoading,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    quoteLoading,
    wrapLoading,
    swapLoading,
    swapError,
    txHash,
    setFromAmount,
    setSwapDirection,
    refreshBalances,
    wrapRbtc,
    quoteSwap,
    executeSwap,
  } = useSovryn();

  useEffect(() => {
    setMounted(true);
  }, []);

  const canSwap = useMemo(() => {
    return mounted && isConnected && isSupportedChain && Number(fromAmount) > 0 && !swapLoading && !wrapLoading;
  }, [fromAmount, isConnected, isSupportedChain, swapLoading, wrapLoading, mounted]);

  return (
    <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-5 backdrop-blur-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-cyan-300">Sovryn AMM Swap</p>
        <p className="mt-1 text-sm text-slate-400">{fromToken} → {toToken}</p>
      </div>

      <div className="mb-4 rounded-xl border border-cyan-400/15 bg-slate-900/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Wallet Balances</p>
          <button
            onClick={() => void refreshBalances()}
            disabled={balanceLoading || !mounted || !isConnected || !isSupportedChain}
            className="rounded-md border border-cyan-400/30 bg-slate-900 px-2 py-1 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {balanceLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-cyan-400/10 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400">tRBTC</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{Number(balances.trbtc || 0).toFixed(6)}</p>
          </div>
          <div className="rounded-lg border border-cyan-400/10 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400">WRBTC</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{Number(balances.wrbtc || 0).toFixed(6)}</p>
          </div>
          <div className="rounded-lg border border-cyan-400/10 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400">DoC</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{Number(balances.doc || 0).toFixed(6)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSwapDirection("WRBTC_TO_DOC")}
          disabled={swapLoading || wrapLoading || quoteLoading}
          className={`rounded-md border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            fromToken === "WRBTC"
              ? "border-cyan-300 bg-cyan-500/20 text-cyan-200"
              : "border-cyan-400/30 bg-slate-900 text-slate-300 hover:border-cyan-300"
          }`}
        >
          WRBTC → DoC
        </button>
        <button
          onClick={() => setSwapDirection("DOC_TO_WRBTC")}
          disabled={swapLoading || wrapLoading || quoteLoading}
          className={`rounded-md border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            fromToken === "DOC"
              ? "border-cyan-300 bg-cyan-500/20 text-cyan-200"
              : "border-cyan-400/30 bg-slate-900 text-slate-300 hover:border-cyan-300"
          }`}
        >
          DoC → WRBTC
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          From ({fromToken})
          <input
            type="number"
            min="0"
            step="0.000001"
            value={fromAmount}
            onChange={(event) => setFromAmount(event.target.value)}
            className="mt-1 w-full rounded-md border border-cyan-400/30 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300"
            placeholder="0.0001"
          />
        </label>
        <label className="text-sm text-slate-300">
          To ({toToken})
          <input
            type="text"
            value={toAmount ? Number(toAmount).toFixed(6) : ""}
            readOnly
            className="mt-1 w-full rounded-md border border-cyan-400/20 bg-slate-900/60 px-3 py-2 text-slate-200"
            placeholder="Quote"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {fromToken === "WRBTC" ? (
          <button
            onClick={() => void wrapRbtc()}
            disabled={wrapLoading || !fromAmount || Number(fromAmount) <= 0}
            className="rounded-lg border border-blue-400/30 bg-slate-900 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {wrapLoading ? "Wrapping..." : "Wrap tRBTC → WRBTC"}
          </button>
        ) : null}
        <button
          onClick={() => void quoteSwap()}
          disabled={quoteLoading || wrapLoading || !fromAmount || Number(fromAmount) <= 0}
          className="rounded-lg border border-cyan-400/30 bg-slate-900 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {quoteLoading ? "Quoting..." : "Get Quote"}
        </button>
        <button
          onClick={() => void executeSwap()}
          disabled={!canSwap}
          className="rounded-lg bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {swapLoading ? "Swapping..." : "Swap ahora"}
        </button>
      </div>

      {mounted && !isConnected ? <p className="mt-3 text-sm text-amber-300">Conecta tu wallet para operar.</p> : null}
      {mounted && isConnected && !isSupportedChain ? (
        <p className="mt-3 text-sm text-amber-300">Cambia a Rootstock Testnet (Chain ID 31).</p>
      ) : null}
      {swapError ? <p className="mt-3 text-sm text-rose-400">{swapError}</p> : null}
      {txHash ? (
        <a
          href={`https://explorer.testnet.rootstock.io/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-sm text-cyan-300 underline underline-offset-4"
        >
          Ver transacción on-chain
        </a>
      ) : null}
    </div>
  );
}
