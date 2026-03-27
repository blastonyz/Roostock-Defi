"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { useState } from "react";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain, http } from "viem";
import { WagmiProvider } from "wagmi";
import { SovrynProvider } from "@/contexts/sovryn-context";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "8a670b98943fc13feaebf4def079310b";

// Define Rootstock Testnet
const rootstockTestnet = defineChain({
  id: 31,
  name: "Rootstock Testnet",
  nativeCurrency: { name: "Rootstock Bitcoin", symbol: "tRBTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROOTSTOCK_RPC_URL ||
          process.env.NEXT_PUBLIC_RPC_URL ||
          "https://rootstock-testnet.g.alchemy.com/v2/QO9VEoGt2J53QdbHsiJzZzmJLNdhqj_r",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Rootstock Explorer",
      url: "https://testnet.rootstockexplorer.com/",
    },
  },
  testnet: true,
});

const supportedRpcUrl =
  process.env.NEXT_PUBLIC_ROOTSTOCK_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://rootstock-testnet.g.alchemy.com/v2/QO9VEoGt2J53QdbHsiJzZzmJLNdhqj_r";

const config = getDefaultConfig({
  appName: "Defiar - Rootstock Swap",
  projectId,
  chains: [rootstockTestnet],
  transports: {
    [rootstockTestnet.id]: http(supportedRpcUrl),
  },
  ssr: false,
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <SovrynProvider>{children}</SovrynProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
