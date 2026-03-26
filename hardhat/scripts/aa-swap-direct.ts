/**
 * aa-swap-direct.ts
 * Direct EntryPoint.handleOps() call (bypass bundler)
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
  concat,
} from "viem";

const SWAP_AMOUNT = parseUnits("0.0001", 18);

const erc20Abi = [
  { type: "function" as const, name: "approve", stateMutability: "nonpayable" as const, inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function" as const, name: "balanceOf", stateMutability: "view" as const, inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function" as const, name: "transfer", stateMutability: "nonpayable" as const, inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

const accountAbi = [
  { type: "function" as const, name: "executeBatch", stateMutability: "nonpayable" as const, inputs: [{ type: "address[]" }, { type: "uint256[]" }, { type: "bytes[]" }], outputs: [] },
] as const;

const factoryAbi = [
  { type: "function" as const, name: "getAddress", stateMutability: "view" as const, inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
] as const;

const entryPointAbi = [
  { type: "function" as const, name: "getNonce", stateMutability: "view" as const, inputs: [{ type: "address" }, { type: "uint192" }], outputs: [{ type: "uint256" }] },
  { type: "function" as const, name: "handleOps" as const, stateMutability: "payable" as const, inputs: [{ type: "tuple[]", components: [
    { type: "address", name: "sender" },
    { type: "uint256", name: "nonce" },
    { type: "bytes", name: "initCode" },
    { type: "bytes", name: "callData" },
    { type: "bytes32", name: "accountGasLimits" },
    { type: "uint256", name: "preVerificationGas" },
    { type: "bytes32", name: "gasFees" },
    { type: "bytes", name: "paymasterAndData" },
    { type: "bytes", name: "signature" },
  ]}, { type: "address", name: "beneficiary" }], outputs: [] },
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

function packU128(high: bigint, low: bigint): `0x${string}` {
  return pad(toHex((high << 128n) | low), { size: 32 });
}

function computeUserOpHash(
  sender: `0x${string}`,
  nonce: bigint,
  initCode: `0x${string}`,
  callData: `0x${string}`,
  accountGasLimits: `0x${string}`,
  preVerificationGas: bigint,
  gasFees: `0x${string}`,
  paymasterAndData: `0x${string}`,
  entryPoint: `0x${string}`,
  chainId: bigint,
): `0x${string}` {
  const packed = encodeAbiParameters(
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
      sender,
      nonce,
      keccak256(initCode),
      keccak256(callData),
      accountGasLimits,
      preVerificationGas,
      gasFees,
      keccak256(paymasterAndData),
    ],
  );

  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
      [keccak256(packed), entryPoint, chainId],
    ),
  );
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
  const chainId = BigInt(await publicClient.getChainId());

  console.log("\n=== AA Swap (Direct EntryPoint) ===\n");

  // Get smart account
  const smartAccount = await publicClient.readContract({
    address: FACTORY,
    abi: factoryAbi,
    functionName: "getAddress",
    args: [owner],
  });

  console.log("Smart Account:", smartAccount);

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

  console.log(`Quote: ${formatUnits(SWAP_AMOUNT, 18)} WRBTC → ${formatUnits(quote, 18)} DoC\n`);

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

  // Build UserOp
  const userOp = {
    sender: smartAccount,
    nonce,
    initCode: ("0x") as `0x${string}`,
    callData,
    accountGasLimits: packU128(300_000n, 1_000_000n),
    preVerificationGas: 100_000n,
    gasFees: packU128(2_000_000n, 100_000_000n),
    paymasterAndData: ("0x") as `0x${string}`,
    signature: ("0x") as `0x${string}`,
  };

  // Compute and sign hash
  const userOpHash = computeUserOpHash(
    userOp.sender,
    userOp.nonce,
    userOp.initCode,
    userOp.callData,
    userOp.accountGasLimits,
    userOp.preVerificationGas,
    userOp.gasFees,
    userOp.paymasterAndData,
    ENTRY_POINT,
    chainId,
  );

  const sig = await eoa.signMessage({ message: { raw: userOpHash } });
  userOp.signature = sig;

  console.log("Sending to EntryPoint.handleOps()...");
  const tx = await eoa.writeContract({
    address: ENTRY_POINT,
    abi: entryPointAbi,
    functionName: "handleOps",
    args: [[userOp], owner],
  });

  console.log("Tx:", tx);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log("✅ Done! Status:", receipt.status === "success" ? "SUCCESS" : "FAILED");

  // Check DoC balance
  const docBalance = await publicClient.readContract({
    address: DOC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [smartAccount],
  });

  console.log("DoC balance:", formatUnits(docBalance, 18));
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message, "\n");
  process.exitCode = 1;
});
