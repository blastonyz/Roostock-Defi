/**
 * debug-aa.ts
 * Diagnóstico paso a paso del flujo AA
 */
import "dotenv/config";
import { network } from "hardhat";
import {
  getAddress, isAddress, parseUnits, formatUnits,
  encodeFunctionData, encodeAbiParameters, keccak256, concat, toHex, pad,
} from "viem";

const CANONICAL_EP_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

const factoryAbi = [
  { type: "function", name: "createAccount", stateMutability: "nonpayable", inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
  { type: "function", name: "getAddress", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
] as const;

const accountAbi = [
  {
    type: "function",
    name: "executeBatch",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address[]" }, { type: "uint256[]" }, { type: "bytes[]" },
    ],
    outputs: [],
  },
] as const;

const entryPointAbi = [
  { type: "function", name: "getNonce", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint192" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "handleOps", stateMutability: "nonpayable", inputs: [
    { type: "tuple[]", name: "ops", components: [
      { type: "address", name: "sender" }, { type: "uint256", name: "nonce" },
      { type: "bytes", name: "initCode" }, { type: "bytes", name: "callData" },
      { type: "bytes32", name: "accountGasLimits" }, { type: "uint256", name: "preVerificationGas" },
      { type: "bytes32", name: "gasFees" }, { type: "bytes", name: "paymasterAndData" },
      { type: "bytes", name: "signature" },
    ]},
    { type: "address", name: "beneficiary" },
  ], outputs: [] },
] as const;

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

const swapperAbi = [
  { type: "function", name: "getAmountOut", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "swap", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

function packU128(hi: bigint, lo: bigint): `0x${string}` {
  return pad(toHex((hi << 128n) | lo), { size: 32 });
}

function computeUserOpHash(
  userOp: { sender: `0x${string}`; nonce: bigint; initCode: `0x${string}`; callData: `0x${string}`; accountGasLimits: `0x${string}`; preVerificationGas: bigint; gasFees: `0x${string}`; paymasterAndData: `0x${string}`; },
  entryPoint: `0x${string}`, chainId: bigint
): `0x${string}` {
  const innerHash = keccak256(encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }, { type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }, { type: "uint256" }, { type: "bytes32" }, { type: "bytes32" }],
    [userOp.sender, userOp.nonce, keccak256(userOp.initCode), keccak256(userOp.callData), userOp.accountGasLimits as `0x${string}`, userOp.preVerificationGas, userOp.gasFees as `0x${string}`, keccak256(userOp.paymasterAndData)],
  ));
  return keccak256(encodeAbiParameters(
    [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
    [innerHash, entryPoint, chainId],
  ));
}

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const eoa = wallets[0]!;
  const eoaAddress = eoa.account.address;
  const chainId = BigInt(await pub.getChainId());

  const EP = getAddress(process.env.ENTRY_POINT_ADDRESS!);
  const FACTORY = getAddress(process.env.AA_FACTORY_ADDRESS!);
  const SWAPPER = getAddress(process.env.SOVRYN_SWAPPER_ADDRESS!);
  const WRBTC = getAddress(process.env.SOVRYN_WRBTC_ADDRESS!);
  const DOC = getAddress(process.env.SOVRYN_DOC_ADDRESS!);

  console.log("=== AA Debug ===");
  console.log("ChainID:", chainId.toString());
  console.log("EOA:", eoaAddress);
  console.log("EntryPoint (custom):", EP);

  // Check canonical EP v0.7
  const canonCode = await pub.getBytecode({ address: CANONICAL_EP_V07 as `0x${string}` });
  console.log("Canonical EP v0.7 exists:", !!(canonCode && canonCode !== "0x") ? "✅" : "❌");

  // ── Step 1: Deploy account separately (not via UserOp) ──
  console.log("\n[1] Deploying smart account via factory directly...");
  const smartAccount = await pub.readContract({ address: FACTORY, abi: factoryAbi, functionName: "getAddress", args: [eoaAddress] });
  const code = await pub.getBytecode({ address: smartAccount });
  const deployed = !!(code && code !== "0x");

  if (!deployed) {
    const tx = await eoa.writeContract({ address: FACTORY, abi: factoryAbi, functionName: "createAccount", args: [eoaAddress] });
    await pub.waitForTransactionReceipt({ hash: tx });
    console.log("✅ Account deployed at:", smartAccount, "tx:", tx);
  } else {
    console.log("✅ Account already deployed at:", smartAccount);
  }

  // ── Step 2: Fund smart account with tRBTC for self-pay gas ──
  const acctBal = await pub.getBalance({ address: smartAccount });
  const requiredEth = parseUnits("0.00005", 18); // 0.00005 tRBTC
  if (acctBal < requiredEth) {
    console.log("\n[2] Funding smart account with tRBTC for gas...");
    const fundTx = await eoa.sendTransaction({ to: smartAccount, value: requiredEth });
    await pub.waitForTransactionReceipt({ hash: fundTx });
    console.log("✅ Funded. tx:", fundTx);
  } else {
    console.log("\n[2] Smart account tRBTC balance OK:", formatUnits(acctBal, 18));
  }

  // ── Step 3: Transfer WRBTC to smart account ──
  const amountIn = parseUnits("0.0001", 18);
  const wrbtcInAcct = await pub.readContract({ address: WRBTC, abi: erc20Abi, functionName: "balanceOf", args: [smartAccount] });
  if (wrbtcInAcct < amountIn) {
    console.log("\n[3] Transferring WRBTC to smart account...");
    const transferTx = await eoa.writeContract({ address: WRBTC, abi: erc20Abi, functionName: "transfer", args: [smartAccount, amountIn] });
    await pub.waitForTransactionReceipt({ hash: transferTx });
    console.log("✅ Transferred. tx:", transferTx);
  } else {
    console.log("\n[3] Smart account WRBTC OK:", formatUnits(wrbtcInAcct, 18));
  }

  // ── Step 4: Get quote ──
  const quote = await pub.readContract({ address: SWAPPER, abi: swapperAbi, functionName: "getAmountOut", args: [WRBTC, DOC, amountIn] });
  const minOut = (quote * 98n) / 100n;
  console.log(`\nQuote: ${formatUnits(amountIn, 18)} WRBTC → ${formatUnits(quote, 18)} DoC`);

  // ── Step 5: Build UserOp (NO initCode, NO paymaster - self pay) ──
  const approveData = encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [SWAPPER, amountIn] });
  const swapData = encodeFunctionData({ abi: swapperAbi, functionName: "swap", args: [WRBTC, DOC, amountIn, minOut] });
  const callData = encodeFunctionData({
    abi: accountAbi,
    functionName: "executeBatch",
    args: [[WRBTC, SWAPPER], [0n, 0n], [approveData, swapData]],
  });

  const nonce = await pub.readContract({ address: EP, abi: entryPointAbi, functionName: "getNonce", args: [smartAccount, 0n] });
  console.log("Nonce:", nonce.toString());

  const verGasLimit = 150_000n;
  const callGasLimit = 500_000n;
  const preVerGas = 50_000n;
  const maxPrio = 1_000_000n;
  const maxFee = 60_000_000n;

  const userOp = {
    sender: smartAccount,
    nonce,
    initCode: "0x" as `0x${string}`,
    callData,
    accountGasLimits: packU128(verGasLimit, callGasLimit),
    preVerificationGas: preVerGas,
    gasFees: packU128(maxPrio, maxFee),
    paymasterAndData: "0x" as `0x${string}`,   // NO paymaster - self pay
    signature: "0x" as `0x${string}`,
  };

  // ── Step 6: Hash and sign ──
  const userOpHash = computeUserOpHash(userOp, EP, chainId);
  console.log("UserOpHash:", userOpHash);

  const signature = await eoa.signMessage({ message: { raw: userOpHash } });
  userOp.signature = signature;
  console.log("Signature:", signature.slice(0, 20) + "...");

  // ── Step 7: Submit via handleOps ──
  console.log("\nEnviando handleOps (self-pay, no paymaster)...");
  try {
    const tx = await eoa.writeContract({
      address: EP,
      abi: entryPointAbi,
      functionName: "handleOps",
      args: [[userOp], eoaAddress],
      gas: 3_000_000n,
    });
    const receipt = await pub.waitForTransactionReceipt({ hash: tx });
    console.log("handleOps status:", receipt.status === "success" ? "✅ SUCCESS" : "❌ REVERTED");
    console.log("tx:", tx);

    const docBal = await pub.readContract({ address: DOC, abi: erc20Abi, functionName: "balanceOf", args: [smartAccount] });
    console.log("Smart Account DoC:", formatUnits(docBal, 18));
  } catch (err: any) {
    console.error("❌ handleOps error:", err?.details ?? err?.shortMessage ?? err?.message);
  }
}

main().catch(console.error);
