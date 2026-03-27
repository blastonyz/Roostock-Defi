"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatUnits, getAddress, parseUnits } from "viem";
import { getWalletClient } from "@wagmi/core";
import { useAccount, useChainId, useConfig, usePublicClient } from "wagmi";
import sovrynSwapperArtifact from "@/lib/contracts/SovrynSwapper.json";

export type SwapToken = "WRBTC" | "DOC";
export type SwapDirection = "WRBTC_TO_DOC" | "DOC_TO_WRBTC";

type SwapExecutionParams = {
  fromToken?: SwapToken;
  toToken?: SwapToken;
  fromAmount?: string;
};

type WalletBalances = {
  wrbtc: string;
  doc: string;
  trbtc: string;
};

type SovrynContextValue = {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isSupportedChain: boolean;
  
  // Swap state
  fromToken: SwapToken;
  toToken: SwapToken;
  fromAmount: string;
  toAmount: string;
  quoteLoading: boolean;
  wrapLoading: boolean;
  swapLoading: boolean;
  swapError: string | null;
  txHash: string | null;
  slippageBps: number;
  balanceLoading: boolean;
  balances: WalletBalances;
  
  // Swap actions
  setFromAmount: (amount: string) => void;
  setSlippageBps: (bps: number) => void;
  setSwapDirection: (direction: SwapDirection) => void;
  refreshBalances: () => Promise<void>;
  wrapRbtc: () => Promise<string | null>;
  quoteSwap: (params?: SwapExecutionParams) => Promise<void>;
  toggleTokens: () => void;
  executeSwap: (params?: SwapExecutionParams) => Promise<string | null>;
  
  // Contract addresses
  contracts: {
    wrbtc: string;
    doc: string;
    swapper: string;
  };
};

const SovrynContext = createContext<SovrynContextValue | undefined>(undefined);
const SUPPORTED_CHAIN_ID = 31; // Rootstock Testnet
const DEFAULT_SLIPPAGE_BPS = 500; // 5% for testnet volatility

const DEFAULT_CONTRACTS = {
  wrbtc: "0x69fe5cec81d5ef92600c1a0db1f11986ab3758ab",
  doc: "0xcb46c0ddc60d18efeb0e586c17af6ea36452dae0",
  swapper: "0x09c8a630b50412542bb7c4c149e72983db208e3c",
} as const;

const EMPTY_BALANCES: WalletBalances = {
  wrbtc: "0",
  doc: "0",
  trbtc: "0",
};

function normalizeAddress(value: string, fallback: string): `0x${string}` {
  try {
    return getAddress(value);
  } catch {
    return getAddress(fallback);
  }
}

function extractReadableError(error: unknown): string {
  if (error instanceof Error) {
    const maybeViem = error as Error & { shortMessage?: string; details?: string };
    if (maybeViem.shortMessage && maybeViem.shortMessage.trim().length > 0) {
      return maybeViem.shortMessage;
    }
    if (maybeViem.details && maybeViem.details.trim().length > 0) {
      return maybeViem.details;
    }
    return error.message;
  }
  return "Swap failed";
}

function getTokenAddress(token: SwapToken, contracts: { wrbtc: string; doc: string }): `0x${string}` {
  return (token === "WRBTC" ? contracts.wrbtc : contracts.doc) as `0x${string}`;
}

function resolveExecutionParams(
  params: SwapExecutionParams | undefined,
  defaultFromToken: SwapToken,
  defaultToToken: SwapToken,
  defaultFromAmount: string
) {
  return {
    effectiveFromToken: params?.fromToken ?? defaultFromToken,
    effectiveToToken: params?.toToken ?? defaultToToken,
    effectiveFromAmount: params?.fromAmount ?? defaultFromAmount,
  };
}

export function SovrynProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, address } = useAccount();
  const wagmiConfig = useConfig();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  
  const [fromToken, setFromToken] = useState<SwapToken>("WRBTC");
  const [toToken, setToToken] = useState<SwapToken>("DOC");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [wrapLoading, setWrapLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [slippageBps, setSlippageBps] = useState<number>(DEFAULT_SLIPPAGE_BPS);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balances, setBalances] = useState<WalletBalances>(EMPTY_BALANCES);

  const contracts = useMemo(() => {
    return {
      wrbtc: normalizeAddress(
        process.env.NEXT_PUBLIC_SOVRYN_WRBTC_ADDRESS?.trim() || DEFAULT_CONTRACTS.wrbtc,
        DEFAULT_CONTRACTS.wrbtc
      ),
      doc: normalizeAddress(
        process.env.NEXT_PUBLIC_SOVRYN_DOC_ADDRESS?.trim() || DEFAULT_CONTRACTS.doc,
        DEFAULT_CONTRACTS.doc
      ),
      swapper: normalizeAddress(
        process.env.NEXT_PUBLIC_SOVRYN_SWAPPER_ADDRESS?.trim() || DEFAULT_CONTRACTS.swapper,
        DEFAULT_CONTRACTS.swapper
      ),
    };
  }, []);

  const erc20Abi = [
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ type: "address" }],
      outputs: [{ type: "uint256" }],
    },
    {
      type: "function",
      name: "allowance",
      stateMutability: "view",
      inputs: [{ type: "address" }, { type: "address" }],
      outputs: [{ type: "uint256" }],
    },
    {
      type: "function",
      name: "approve",
      stateMutability: "nonpayable",
      inputs: [{ type: "address" }, { type: "uint256" }],
      outputs: [{ type: "bool" }],
    },
  ] as const;

  const wrbtcAbi = [
    {
      type: "function",
      name: "deposit",
      stateMutability: "payable",
      inputs: [],
      outputs: [],
    },
  ] as const;

  const swapperAbi = sovrynSwapperArtifact.abi;

  const refreshBalances = async () => {
    if (!publicClient || !address || chainId !== SUPPORTED_CHAIN_ID) {
      setBalances(EMPTY_BALANCES);
      return;
    }

    try {
      setBalanceLoading(true);

      const [wrbtcBalance, docBalance, nativeBalance] = await Promise.all([
        publicClient.readContract({
          address: contracts.wrbtc,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: contracts.doc,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.getBalance({ address }),
      ]);

      setBalances({
        wrbtc: formatUnits(wrbtcBalance as bigint, 18),
        doc: formatUnits(docBalance as bigint, 18),
        trbtc: formatUnits(nativeBalance, 18),
      });
    } catch {
      setBalances(EMPTY_BALANCES);
    } finally {
      setBalanceLoading(false);
    }
  };

  const toggleTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount("");
    setToAmount("");
  };

  const setSwapDirection = (direction: SwapDirection) => {
    if (direction === "WRBTC_TO_DOC") {
      setFromToken("WRBTC");
      setToToken("DOC");
    } else {
      setFromToken("DOC");
      setToToken("WRBTC");
    }
    setToAmount("");
  };

  useEffect(() => {
    void refreshBalances();
  }, [address, chainId, publicClient, contracts]);

  useEffect(() => {
    if (!txHash) {
      return;
    }

    void refreshBalances();
  }, [txHash]);

  const quoteSwap = async (params?: SwapExecutionParams) => {
    if (!publicClient) return;

    const { effectiveFromToken, effectiveToToken, effectiveFromAmount } = resolveExecutionParams(
      params,
      fromToken,
      toToken,
      fromAmount
    );

    if (!effectiveFromAmount || Number(effectiveFromAmount) <= 0) {
      setToAmount("");
      return;
    }

    try {
      setQuoteLoading(true);
      setSwapError(null);

      const amountIn = parseUnits(effectiveFromAmount, 18);
      const tokenIn = getTokenAddress(effectiveFromToken, contracts);
      const tokenOut = getTokenAddress(effectiveToToken, contracts);
      const quote = await publicClient.readContract({
        address: contracts.swapper as `0x${string}`,
        abi: swapperAbi,
        functionName: "getAmountOut",
        args: [tokenIn, tokenOut, amountIn],
      });

      setToAmount(formatUnits(quote as bigint, 18));
    } catch (error: unknown) {
      setSwapError(error instanceof Error ? error.message : "Failed to get quote");
      setToAmount("");
    } finally {
      setQuoteLoading(false);
    }
  };

  const wrapRbtc = async (): Promise<string | null> => {
    try {
      const walletClient = (await getWalletClient(wagmiConfig, {
        chainId: SUPPORTED_CHAIN_ID,
      })) as any;

      if (!publicClient || !walletClient || !address) {
        throw new Error("Conecta la wallet para wrapear");
      }
      if (chainId !== SUPPORTED_CHAIN_ID) {
        throw new Error("Cambia a Rootstock Testnet (Chain 31)");
      }
      if (fromToken !== "WRBTC") {
        throw new Error("El wrap de tRBTC solo aplica cuando el token origen es WRBTC");
      }
      if (!fromAmount || Number(fromAmount) <= 0) {
        throw new Error("Ingresa un monto válido para wrapear");
      }

      const value = parseUnits(fromAmount, 18);
      const nativeBalance = await publicClient.getBalance({ address });
      if (nativeBalance < value) {
        throw new Error(
          `Balance insuficiente tRBTC. Tienes ${formatUnits(nativeBalance, 18)} y necesitas ${formatUnits(value, 18)}`
        );
      }

      setWrapLoading(true);
      setSwapError(null);
      setTxHash(null);

      const wrapHash = await walletClient.writeContract({
        account: address,
        address: contracts.wrbtc,
        abi: wrbtcAbi,
        functionName: "deposit",
        args: [],
        value,
      });

      await publicClient.waitForTransactionReceipt({ hash: wrapHash });
      setTxHash(wrapHash);
      return wrapHash;
    } catch (error: unknown) {
      setSwapError(extractReadableError(error));
      return null;
    } finally {
      setWrapLoading(false);
    }
  };

  const executeSwap = async (params?: SwapExecutionParams): Promise<string | null> => {
    try {
      const walletClient = (await getWalletClient(wagmiConfig, {
        chainId: SUPPORTED_CHAIN_ID,
      })) as any;

      const { effectiveFromToken, effectiveToToken, effectiveFromAmount } = resolveExecutionParams(
        params,
        fromToken,
        toToken,
        fromAmount
      );

      if (!publicClient || !walletClient || !address) {
        throw new Error("Conecta la wallet para hacer swap");
      }
      if (chainId !== SUPPORTED_CHAIN_ID) {
        throw new Error("Cambia a Rootstock Testnet (Chain 31)");
      }
      if (!effectiveFromAmount || Number(effectiveFromAmount) <= 0) {
        throw new Error(`Ingresa un monto válido de ${effectiveFromToken}`);
      }

      setSwapLoading(true);
      setSwapError(null);
      setTxHash(null);

      const amountIn = parseUnits(effectiveFromAmount, 18);
      const tokenIn = getTokenAddress(effectiveFromToken, contracts);
      const tokenOut = getTokenAddress(effectiveToToken, contracts);

      const walletBalance = await publicClient.readContract({
        address: tokenIn,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });

      if ((walletBalance as bigint) < amountIn) {
        throw new Error(
          `Balance insuficiente ${effectiveFromToken}. Tienes ${formatUnits(walletBalance as bigint, 18)} y necesitas ${formatUnits(amountIn, 18)}${effectiveFromToken === "WRBTC" ? '. Usa "Wrap tRBTC" primero.' : ""}`
        );
      }

      const quote = await publicClient.readContract({
        address: contracts.swapper,
        abi: swapperAbi,
        functionName: "getAmountOut",
        args: [tokenIn, tokenOut, amountIn],
      });
      const minAmountOut = ((quote as bigint) * (10000n - BigInt(slippageBps))) / 10000n;

      const allowance = await publicClient.readContract({
        address: tokenIn,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, contracts.swapper],
      });

      if ((allowance as bigint) < amountIn) {
        const approveHash = await walletClient.writeContract({
          account: address,
          address: tokenIn,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.swapper, amountIn] as const,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      await publicClient.simulateContract({
        account: address,
        address: contracts.swapper,
        abi: swapperAbi,
        functionName: "swap",
        args: [tokenIn, tokenOut, amountIn, minAmountOut],
      });

      const swapHash = await walletClient.writeContract({
        account: address,
        address: contracts.swapper,
        abi: swapperAbi,
        functionName: "swap",
        args: [tokenIn, tokenOut, amountIn, minAmountOut],
      });
      await publicClient.waitForTransactionReceipt({ hash: swapHash });

      setTxHash(swapHash);
      await quoteSwap({
        fromToken: effectiveFromToken,
        toToken: effectiveToToken,
        fromAmount: effectiveFromAmount,
      });
      return swapHash;
    } catch (error: unknown) {
      setSwapError(extractReadableError(error));
      return null;
    } finally {
      setSwapLoading(false);
    }
  };

  const value = useMemo<SovrynContextValue>(
    () => ({
      isConnected,
      address,
      chainId,
      isSupportedChain: chainId === SUPPORTED_CHAIN_ID,
      
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      quoteLoading,
      wrapLoading,
      swapLoading,
      swapError,
      txHash,
      slippageBps,
      balanceLoading,
      balances,
      
      setFromAmount,
      setSlippageBps,
      setSwapDirection,
      refreshBalances,
      wrapRbtc,
      quoteSwap,
      toggleTokens,
      executeSwap,

      contracts,
    }),
    [
      address,
      chainId,
      contracts,
      executeSwap,
      isConnected,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      quoteLoading,
      wrapLoading,
      swapLoading,
      swapError,
      balanceLoading,
      balances,
      slippageBps,
      txHash,
      refreshBalances,
      wrapRbtc,
      quoteSwap,
    ]
  );

  return (
    <SovrynContext.Provider value={value}>{children}</SovrynContext.Provider>
  );
}

export function useSovryn() {
  const context = useContext(SovrynContext);
  if (!context) {
    throw new Error("useSovryn must be used inside SovrynProvider");
  }
  return context;
}
