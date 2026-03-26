/**
 * aa-swap.ts
 * Complete AA + Sovryn Swap via Bundler
 * 
 * Based on tested execute.ts pattern:
 * 1. Build UserOp with initial values
 * 2. Calculate hash and sign
 * 3. Estimate gas via bundler
 * 4. Recalculate hash with estimated gas
 * 5. Re-sign with final hash
 * 6. Send to bundler
 * 7. Poll for receipt
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
} from "viem";

const CREATE_ACCOUNT_GAS = 1_500_000n;
const SMART_ACCOUNT_NATIVE_FUND = parseUnits("0.00005", 18);
const SWAP_AMOUNT = parseUnits("0.0001", 18);

// ─── ABIs ────────────────────────────────────────────────────────────────

const erc20Abi = [
  {
    type: "function" as const,
    name: "balanceOf",
    stateMutability: "view" as const,
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function" as const,
    name: "approve",
    stateMutability: "nonpayable" as const,
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function" as const,
    name: "transfer",
    stateMutability: "nonpayable" as const,
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const accountAbi = [
  {
    type: "function" as const,
    name: "executeBatch",
    stateMutability: "nonpayable" as const,
    inputs: [
      { type: "address[]", name: "dest" },
      { type: "uint256[]", name: "value" },
      { type: "bytes[]", name: "func" },
    ],
    outputs: [],
  },
] as const;

const factoryAbi = [
  {
    type: "function" as const,
    name: "createAccount",
    stateMutability: "nonpayable" as const,
    inputs: [{ type: "address" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function" as const,
    name: "getAddress",
    stateMutability: "view" as const,
    inputs: [{ type: "address" }],
    outputs: [{ type: "address" }],
  },
] as const;

const entryPointAbi = [
  {
    type: "function" as const,
    name: "getNonce",
    stateMutability: "view" as const,
    inputs: [{ type: "address" }, { type: "uint192" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function" as const,
    name: "getUserOpHash",
    stateMutability: "view" as const,
    inputs: [
      {
        type: "tuple",
        components: [
          { type: "address", name: "sender" },
          { type: "uint256", name: "nonce" },
          { type: "bytes", name: "initCode" },
          { type: "bytes", name: "callData" },
          { type: "bytes32", name: "accountGasLimits" },
          { type: "uint256", name: "preVerificationGas" },
          { type: "bytes32", name: "gasFees" },
          { type: "bytes", name: "paymasterAndData" },
          { type: "bytes", name: "signature" },
        ],
      },
    ],
    outputs: [{ type: "bytes32" }],
  },
] as const;

const swapperAbi = [
  {
    type: "function" as const,
    name: "getAmountOut",
    stateMutability: "view" as const,
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function" as const,
    name: "swap",
    stateMutability: "nonpayable" as const,
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────

type UserOpUnpacked = {
  sender: string;
  nonce: string;
  initCode?: string;
  callData: string;
  callGasLimit?: string;
  verificationGasLimit?: string;
  preVerificationGas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  paymaster?: string;
  paymasterData?: string;
  paymasterVerificationGasLimit?: string;
  paymasterPostOpGasLimit?: string;
  factory?: string;
  factoryData?: string;
  signature: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function requireAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`${label} inválida o faltante en .env`);
  }
  return getAddress(value);
}

function packGas(high: string, low: string): string {
  const highBig = BigInt(high);
  const lowBig = BigInt(low);
  const packed = (highBig << 128n) | lowBig;
  return "0x" + packed.toString(16).padStart(64, "0");
}

function computeUserOpHash(userOp: {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: string;
  gasFees: string;
  paymasterAndData: string;
}, entryPoint: string, chainId: string): string {
  const innerHash = keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "bytes32" },
      ],
      [
        userOp.sender as `0x${string}`,
        BigInt(userOp.nonce),
        keccak256(userOp.initCode as `0x${string}`),
        keccak256(userOp.callData as `0x${string}`),
        userOp.accountGasLimits as `0x${string}`,
        BigInt(userOp.preVerificationGas),
        userOp.gasFees as `0x${string}`,
        keccak256(userOp.paymasterAndData as `0x${string}`),
      ],
    ),
  );

  const hash = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
      [innerHash, entryPoint as `0x${string}`, BigInt(chainId)],
    ),
  );
  
  return hash;
}

async function bundlerRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const data = (await response.json()) as {
    result?: T;
    error?: { message?: string; code?: number; data?: unknown };
  };

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? `RPC ${method} falló con HTTP ${response.status}`);
  }

  if (data.result === undefined) {
    throw new Error(`RPC ${method} no devolvió result`);
  }

  return data.result;
}

async function waitForUserOpReceipt(url: string, userOpHash: string): Promise<unknown> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const receipt = await bundlerRpc<unknown | null>(url, "eth_getUserOperationReceipt", [userOpHash]);
    if (receipt) {
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  throw new Error("Timeout esperando eth_getUserOperationReceipt");
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const bundlerUrl = process.env.BUNDLER_RPC_URL?.trim();
  if (!bundlerUrl) {
    throw new Error("BUNDLER_RPC_URL faltante en .env");
  }

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
    throw new Error("No hay wallet configurada. Configura RSK_PRIVATE_KEY en .env");
  }

  const owner = eoa.account.address;
  const chainId = await publicClient.getChainId();
  const chainIdHex = "0x" + BigInt(chainId).toString(16);

  console.log("\n=== AA + Sovryn Swap via Bundler ===\n");
  console.log("📍 EOA:", owner);
  console.log("📍 EntryPoint:", ENTRY_POINT);
  console.log("📍 Bundler:", bundlerUrl.split("?")[0]);

  // Check bundler support
  const supportedEntryPoints = await bundlerRpc<string[]>(bundlerUrl, "eth_supportedEntryPoints", []);
  console.log("✅ Bundler EntryPoints:", supportedEntryPoints.join(", "));

  // Get smart account address
  const smartAccount = await publicClient.readContract({
    address: FACTORY,
    abi: factoryAbi,
    functionName: "getAddress",
    args: [owner],
  });
  console.log("📍 Smart Account:", smartAccount);

  // Deploy if needed
  const smartAccountCode = await publicClient.getBytecode({ address: smartAccount });
  const isDeployed = !!smartAccountCode && smartAccountCode !== "0x";

  let initCode = "0x";
  if (!isDeployed) {
    console.log("\n  → Deploying smart account...");
    const createHash = await eoa.writeContract({
      address: FACTORY,
      abi: factoryAbi,
      functionName: "createAccount",
      args: [owner],
      gas: CREATE_ACCOUNT_GAS,
    });
    await publicClient.waitForTransactionReceipt({ hash: createHash });
    console.log("  ✓ Deployed:", createHash);
  } else {
    console.log("✅ Smart account already deployed");
  }

  // Fund native token
  const smartAccountNative = await publicClient.getBalance({ address: smartAccount });
  if (smartAccountNative < SMART_ACCOUNT_NATIVE_FUND) {
    console.log("  → Funding with native token...");
    const fundHash = await eoa.sendTransaction({
      to: smartAccount,
      value: SMART_ACCOUNT_NATIVE_FUND - smartAccountNative,
    });
    await publicClient.waitForTransactionReceipt({ hash: fundHash });
    console.log("  ✓ Funded:", fundHash);
  }

  // Check EOA WRBTC
  const eoaWrbtc = await publicClient.readContract({
    address: WRBTC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });

  if (eoaWrbtc < SWAP_AMOUNT) {
    throw new Error(`WRBTC insuficiente en EOA: ${formatUnits(eoaWrbtc, 18)}`);
  }

  // Fund WRBTC to smart account
  const smartAccountWrbtc = await publicClient.readContract({
    address: WRBTC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [smartAccount],
  });

  if (smartAccountWrbtc < SWAP_AMOUNT) {
    console.log("  → Transferring WRBTC...");
    const transferHash = await eoa.writeContract({
      address: WRBTC,
      abi: erc20Abi,
      functionName: "transfer",
      args: [smartAccount, SWAP_AMOUNT - smartAccountWrbtc],
    });
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log("  ✓ Transferred:", transferHash);
  }

  // Get quote
  const quote = await publicClient.readContract({
    address: SWAPPER,
    abi: swapperAbi,
    functionName: "getAmountOut",
    args: [WRBTC, DOC, SWAP_AMOUNT],
  });
  const minAmountOut = (quote * 95n) / 100n; // 5% slippage

  console.log(`\n💱 Quote: ${formatUnits(SWAP_AMOUNT, 18)} WRBTC → ${formatUnits(quote, 18)} DoC`);

  // Build callData for executeBatch: [approve WRBTC -> SWAPPER, swap]
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

  // Get nonce
  const nonce = await publicClient.readContract({
    address: ENTRY_POINT,
    abi: entryPointAbi,
    functionName: "getNonce",
    args: [smartAccount, 0n],
  });

  // ─── Step 1: Build initial UserOp (unpacked format) ─────────────────

  const userOpBase: UserOpUnpacked = {
    sender: smartAccount,
    nonce: "0x" + BigInt(nonce).toString(16),
    initCode: initCode,
    callData: callData,
    callGasLimit: "0x186a0", // 100k
    verificationGasLimit: "0x186a0", // 100k
    preVerificationGas: "0x14fa0", // 85.4k
    maxFeePerGas: "0x0",
    maxPriorityFeePerGas: "0x0",
    signature: "0x" + "00".repeat(65), // 65 bytes dummy sig
  };

  // Build packed format for hash calculation
  const toPackedUserOp = (userOp: UserOpUnpacked) => ({
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: userOp.initCode || "0x",
    callData: userOp.callData,
    accountGasLimits: packGas(userOp.verificationGasLimit || "0x0", userOp.callGasLimit || "0x0"),
    preVerificationGas: userOp.preVerificationGas,
    gasFees: packGas(userOp.maxPriorityFeePerGas || "0x0", userOp.maxFeePerGas || "0x0"),
    paymasterAndData: "0x",
    signature: userOp.signature,
  });

  // Get initial hash
  const initialPackedUserOp = toPackedUserOp(userOpBase);
  const initialHash = computeUserOpHash(initialPackedUserOp, ENTRY_POINT, chainIdHex);

  // Sign initial hash
  const initialSig = await eoa.signMessage({
    message: { raw: initialHash },
  });

  userOpBase.signature = initialSig;

  // ─── Step 2: Estimate gas via bundler ──────────────────────────────

  console.log("\n  → Estimating gas via bundler...");
  const estimate = await bundlerRpc<{
    preVerificationGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
  }>(bundlerUrl, "eth_estimateUserOperationGas", [userOpBase, ENTRY_POINT]);

  console.log(`    preVeri: ${BigInt(estimate.preVerificationGas).toString()}`);
  console.log(`    verGas:  ${BigInt(estimate.verificationGasLimit).toString()}`);
  console.log(`    callGas: ${BigInt(estimate.callGasLimit).toString()}`);

  // ─── Step 3: Update UserOp with estimated gas ──────────────────────

  userOpBase.verificationGasLimit = estimate.verificationGasLimit;
  userOpBase.callGasLimit = estimate.callGasLimit;
  userOpBase.preVerificationGas = estimate.preVerificationGas;

  // Get gas prices
  const feeData = await publicClient.getFeeData();
  const maxFeePerGas = feeData.gasPrice || 1_000_000n;
  const maxPriorityFeePerGas = (maxFeePerGas * 10n) / 100n; // 10% of max

  userOpBase.maxFeePerGas = "0x" + maxFeePerGas.toString(16);
  userOpBase.maxPriorityFeePerGas = "0x" + maxPriorityFeePerGas.toString(16);

  // ─── Step 4: Recalculate hash with estimated gas ────────────────────

  const finalPackedUserOp = toPackedUserOp(userOpBase);
  const finalHash = computeUserOpHash(finalPackedUserOp, ENTRY_POINT, chainIdHex);

  // Sign final hash
  const finalSig = await eoa.signMessage({
    message: { raw: finalHash },
  });

  userOpBase.signature = finalSig;

  console.log("✅ UserOp signed with final gas values");

  // ─── Step 5: Send to bundler ──────────────────────────────────────

  console.log("\n  → Sending UserOp to bundler...");
  const userOpHash = await bundlerRpc<string>(bundlerUrl, "eth_sendUserOperation", [
    userOpBase,
    ENTRY_POINT,
  ]);
  console.log("✅ Sent. UserOp hash:", userOpHash);

  // ─── Step 6: Wait for receipt ─────────────────────────────────────

  console.log("\n  → Waiting for bundler execution (polling up to 2 min)...");
  const receipt = await waitForUserOpReceipt(bundlerUrl, userOpHash);
  console.log("✅ Receipt:", JSON.stringify(receipt, null, 2));

  // ─── Step 7: Verify balances ──────────────────────────────────────

  console.log("\n📊 Final balances:");
  const docBalance = await publicClient.readContract({
    address: DOC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [smartAccount],
  });

  const wrbtcBalance = await publicClient.readContract({
    address: WRBTC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [smartAccount],
  });

  console.log(`    DoC:   ${formatUnits(docBalance, 18)}`);
  console.log(`    WRBTC: ${formatUnits(wrbtcBalance, 18)}`);

  if (docBalance > 0n) {
    console.log("\n✅ AA Swap completed successfully!\n");
  } else {
    console.log("\n⚠️ Swap executed via bundler but DoC balance is 0\n");
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message ?? error, "\n");
  process.exitCode = 1;
});
