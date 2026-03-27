"use client";

import { useState } from "react";
import { useSovryn } from "@/contexts/sovryn-context";

type OhlcPoint = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Signal = {
  action: "BUY_WRBTC" | "SELL_WRBTC" | "HOLD";
  confidence: number;
  reason: string;
};

type RiskMode = "conservative" | "balanced" | "aggressive";

type GeminiSignalResponse = {
  source: string;
  model: string;
  signal: Signal;
  error?: string;
};

type OhlcResponse = {
  data: OhlcPoint[];
  error?: string;
};

export function AiSwapAgentCard() {
  const {
    fromAmount,
    balances,
    balanceLoading,
    setFromAmount,
    setSwapDirection,
    quoteSwap,
    executeSwap,
    swapLoading,
    quoteLoading,
    wrapLoading,
    isConnected,
    isSupportedChain,
    refreshBalances,
    txHash,
  } = useSovryn();

  const [loadingSignal, setLoadingSignal] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [signalSource, setSignalSource] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [riskMode, setRiskMode] = useState<RiskMode>("aggressive");
  const [forceTrade, setForceTrade] = useState(true);

  const fetchSignal = async () => {
    try {
      setLoadingSignal(true);
      setError("");

      const ohlcRes = await fetch("/api/prices/coingecko?id=bitcoin&vs_currency=usd&days=30", {
        method: "GET",
      });
      const ohlcJson = (await ohlcRes.json()) as OhlcResponse;

      if (!ohlcRes.ok || !Array.isArray(ohlcJson.data) || ohlcJson.data.length === 0) {
        throw new Error(ohlcJson.error ?? "No se pudo cargar OHLC");
      }

      const signalRes = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: "WRBTC/DoC",
          horizon: "30D",
          riskMode,
          forceTrade,
          ohlc: ohlcJson.data,
        }),
      });

      const signalJson = (await signalRes.json()) as GeminiSignalResponse;
      if (!signalRes.ok || !signalJson.signal) {
        throw new Error(signalJson.error ?? "Gemini no devolvió señal válida");
      }

      setSignal(signalJson.signal);
      setSignalSource(`${signalJson.source} · ${signalJson.model}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error analizando mercado");
      setSignal(null);
      setSignalSource("");
    } finally {
      setLoadingSignal(false);
    }
  };

  const applyAndExecute = async () => {
    if (!signal) return;

    if (signal.action === "HOLD") {
      setError("Señal HOLD: no se ejecuta swap.");
      return;
    }

    setError("");

    if (signal.action === "BUY_WRBTC") {
      const amountToUse = !fromAmount || Number(fromAmount) <= 0 ? "1" : fromAmount;
      setSwapDirection("DOC_TO_WRBTC");
      setFromAmount(amountToUse);
      await quoteSwap({ fromToken: "DOC", toToken: "WRBTC", fromAmount: amountToUse });
      await executeSwap({ fromToken: "DOC", toToken: "WRBTC", fromAmount: amountToUse });
    } else {
      const amountToUse = !fromAmount || Number(fromAmount) <= 0 ? "0.0001" : fromAmount;
      setSwapDirection("WRBTC_TO_DOC");
      setFromAmount(amountToUse);
      await quoteSwap({ fromToken: "WRBTC", toToken: "DOC", fromAmount: amountToUse });
      await executeSwap({ fromToken: "WRBTC", toToken: "DOC", fromAmount: amountToUse });
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-5 backdrop-blur-sm">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-cyan-300">AI Swap Agent</p>
        <p className="mt-1 text-sm text-slate-400">Gemini analiza OHLC y sugiere DoC ↔ WRBTC.</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-300">
          Risk mode
          <select
            value={riskMode}
            onChange={(event) => setRiskMode(event.target.value as RiskMode)}
            className="ml-2 rounded-md border border-cyan-400/30 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>

        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={forceTrade}
            onChange={(event) => setForceTrade(event.target.checked)}
            className="h-4 w-4 rounded border-cyan-400/30 bg-slate-900"
          />
          Forzar operación (sin HOLD)
        </label>
      </div>

      <div className="mb-3 rounded-xl border border-cyan-400/15 bg-slate-900/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Available Balances</p>
          <button
            onClick={() => void refreshBalances()}
            disabled={balanceLoading || !isConnected || !isSupportedChain}
            className="rounded-md border border-cyan-400/30 bg-slate-900 px-2 py-1 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {balanceLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          tRBTC: {Number(balances.trbtc || 0).toFixed(6)} · WRBTC: {Number(balances.wrbtc || 0).toFixed(6)} · DoC: {Number(balances.doc || 0).toFixed(6)}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => void fetchSignal()}
          disabled={loadingSignal}
          className="rounded-lg border border-cyan-400/30 bg-slate-900 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingSignal ? "Analizando..." : "Analizar con Gemini"}
        </button>

        <button
          onClick={() => void applyAndExecute()}
          disabled={!signal || loadingSignal || quoteLoading || swapLoading || wrapLoading || !isConnected || !isSupportedChain}
          className="rounded-lg bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ejecutar recomendación
        </button>
      </div>

      {signal ? (
        <div className="mt-4 rounded-lg border border-cyan-400/20 bg-slate-900/60 p-3 text-sm text-slate-200">
          <p>
            Acción: <span className="font-semibold text-cyan-200">{signal.action}</span> · Confianza: {signal.confidence}%
          </p>
          <p className="mt-1 text-slate-300">{signal.reason}</p>
          <p className="mt-2 text-xs text-slate-400">Fuente: {signalSource} · Mode: {riskMode}{forceTrade ? " · Forced" : ""}</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
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
      {!isConnected ? <p className="mt-3 text-sm text-amber-300">Conecta wallet para ejecutar señal.</p> : null}
      {isConnected && !isSupportedChain ? (
        <p className="mt-3 text-sm text-amber-300">Cambia a Rootstock Testnet (Chain ID 31).</p>
      ) : null}
    </div>
  );
}
