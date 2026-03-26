/**
 * debug-request.ts
 * Log exacto del request JSON que mandamos al bundler
 */

import "dotenv/config";
import { network } from "hardhat";
import {
  getAddress,
  isAddress,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  encodeAbiParameters,
  keccak256,
  toHex,
  pad,
} from "viem";

const SWAP_AMOUNT = parseUnits("0.0001", 18);

const erc20Abi = [
  { type: "function" as const, name: "approve", stateMutability: "nonpayable" as const, inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function" as const, name: "balanceOf", stateMutability: "view" as const, inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

const accountAbi = [
  { type: "function" as const, name: "executeBatch", stateMutability: "nonpayable" as const, inputs: [{ type: "address[]" }, { type: "uint256[]" }, { type: "bytes[]" }], outputs: [] },
] as const;

const factoryAbi = [
  { type: "function" as const, name: "getAddress", stateMutability: "view" as const, inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
] as const;

const entryPointAbi = [
  { type: "function" as const, name: "getNonce", stateMutability: "view" as const, inputs: [{ type: "address" }, { type: "uint192" }], outputs: [{ type: "uint256" }] },
] as const;

const swapperAbi = [
  { type: "function" as const, name: "getAmountOut", stateMutability: "view" as const, inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function" as const, name: "swap", stateMutability: "nonpayable" as const, inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

function requireAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`${label} missing`);
  }
  return getAddress(value);
}

function packGas(high: string, low: string): string {
  const highBig = BigInt(high);
  const lowBig = BigInt(low);
  const packed = (highBig << 128n) | lowBig;
  return "0x" + packed.toString(16).padStart(64, "0");
}

async function main() {
  const ENTRY_POINT = requireAddress(process.env.ENTRY_POINT_ADDRESS, "ENTRY_POINT_ADDRESS");
  const FACTORY = requireAddress(process.env.AA_FACTORY_ADDRESS, "AA_FACTORY_ADDRESS");
  const SWAPPER = requireAddress(process.env.SOVRYN_SWAPPER_ADDRESS, "SOVRYN_SWAPPER_ADDRESS");
  const WRBTC = requireAddress(process.env.SOVRYN_WRBTC_ADDRESS, "SOVRYN_WRBTC_ADDRESS");
  const DOC = requireAddress(process.env.SOVRYN_DOC_ADDRESS, "SOVRYN_DOC_ADDRESS");

  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const eoa = walletClients[0];

  if (!eoa) {
    throw new Error("No wallet");
  }

  const owner = eoa.account.address;

  // Get smart account
  const smartAccount = await publicClient.readContract({
    address: FACTORY,
    abi: factoryAbi,
    functionName: "getAddress",
    args: [owner],
  });

  // Get nonce
  const nonce = await publicClient.readContract({
    address: ENTRY_POINT,
    abi: entryPointAbi,
    functionName: "getNonce",
    args: [smartAccount, 0n],
  });

  // Get quote
  const quote = await publicClient.readContract({
    address: SWAPPER,
    abi: swapperAbi,
    functionName: "getAmountOut",
    args: [WRBTC, DOC, SWAP_AMOUNT],
  });
  const minAmountOut = (quote * 95n) / 100n;

  // Build callData
  const approveCall = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [SWAPPER, SWAP_AMOUNT],
  });

  const swapCall = encodeFunctionData({
    abi: swapperAbi,
    functionName: "swap",
    args: [WRBTC, DOC, SWAP_AMOUNT, minAmountOut],
  });

  const callData = encodeFunctionData({
    abi: accountAbi,
    functionName: "executeBatch",
    args: [[WRBTC, SWAPPER], [0n, 0n], [approveCall, swapCall]],
  });

  // Build UserOp (unpacked format for bundler)
  const userOpUnpacked = {
    sender: smartAccount,
    nonce: "0x" + BigInt(nonce).toString(16),
    initCode: "0x",
    callData: callData,
    callGasLimit: "0x186a0", // 100k
    verificationGasLimit: "0x186a0", // 100k
    preVerificationGas: "0x14fa0", // 85.4k
    maxFeePerGas: "0x3b9aca00", // 1 gwei
    maxPriorityFeePerGas: "0x3b9aca00", // 1 gwei
    signature: "0x" + "00".repeat(65),
  };

  console.log("\n=== eth_estimateUserOperationGas REQUEST ===\n");
  
  const payload = {
    jsonrpc: "2.0",
    method: "eth_estimateUserOperationGas",
    params: [userOpUnpacked, ENTRY_POINT],
    id: 1,
  };

  console.log(JSON.stringify(payload, null, 2));
  
  console.log("\n=== Try this in Etherspot API Tester ===");
  console.log("URL: https://testnet-rpc.etherspot.io/v1/31");
  console.log("\n(Copy-paste the above JSON and check the response)\n");
}

main().catch(console.error);
