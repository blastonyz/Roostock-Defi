"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { XOConnectProvider } from "xo-connect";

type XoCurrency = {
  id?: string;
  chainId?: string;
  symbol?: string;
  address?: string;
};

type XoClient = {
  alias?: string;
  currencies?: XoCurrency[];
};

const ROOTSTOCK_CHAIN_HEX = "0x1f";
const ROOTSTOCK_RPC_URL =
  process.env.NEXT_PUBLIC_ROOTSTOCK_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://rootstock-testnet.g.alchemy.com/v2/QO9VEoGt2J53QdbHsiJzZzmJLNdhqj_r";

export function XoConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");
  const [connectedAlias, setConnectedAlias] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setStatus("");
      setConnectedAddress("");
      setConnectedAlias("");

      const detected = typeof window !== "undefined" && Boolean((window as any).XOConnect);

      if (!detected) {
        throw new Error("XO no disponible en este navegador.");
      }

      const xoProvider = new XOConnectProvider({
        rpcs: {
          [ROOTSTOCK_CHAIN_HEX]: ROOTSTOCK_RPC_URL,
        },
        defaultChainId: ROOTSTOCK_CHAIN_HEX,
        debug: false,
      });

      const provider = new ethers.providers.Web3Provider(xoProvider as ethers.providers.ExternalProvider, "any");
      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const client = (await xoProvider.getClient()) as XoClient | null;
      const currencies = (await xoProvider.getAvailableCurrencies()) as XoCurrency[];
      const rootstockCurrency = currencies.find(
        (currency) => String(currency.chainId || "").toLowerCase() === ROOTSTOCK_CHAIN_HEX
      );

      setConnectedAddress(address);
      setConnectedAlias(client?.alias || "");

      if (!rootstockCurrency) {
        setStatus("Conectado, pero Rootstock no esta disponible en esta wallet.");
        return;
      }

      setStatus(`XO listo en Rootstock (${rootstockCurrency.symbol || "asset"}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo conectar con XO";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="h-10 w-24 rounded-lg border border-emerald-400/20 bg-slate-900/60" />;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={() => void handleConnect()}
        disabled={loading}
        className="rounded-lg border border-emerald-400/30 bg-slate-900 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Connecting XO..." : "XO Beta"}
      </button>

      {connectedAlias ? <p className="text-xs text-emerald-300">XO: {connectedAlias}</p> : null}
      {connectedAddress ? (
        <p className="text-xs text-slate-400">
          {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
        </p>
      ) : null}

      {status ? <p className="max-w-64 text-xs text-slate-400">{status}</p> : null}
    </div>
  );
}