import "dotenv/config";
import { network } from "hardhat";
import { encodeFunctionData, getAddress, isAddress, parseUnits } from "viem";

const SWAP_AMOUNT = parseUnits("0.0001", 18);

const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

const accountAbi = [
  {
    type: "function",
    name: "executeBatch",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address[]", name: "dest" },
      { type: "uint256[]", name: "value" },
      { type: "bytes[]", name: "func" },
    ],
    outputs: [],
  },
] as const;

const factoryAbi = [
  { type: "function", name: "getAddress", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
] as const;

const entryPointAbi = [
  { type: "function", name: "getNonce", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint192" }], outputs: [{ type: "uint256" }] },
] as const;

const swapperAbi = [
  { type: "function", name: "getAmountOut", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "swap", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

function reqAddress(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`${name} inválida o faltante`);
  }
  return getAddress(value);
}

function hex(n: bigint) {
  return `0x${n.toString(16)}`;
}

function pack128x2(high: bigint, low: bigint) {
  return `0x${((high << 128n) | low).toString(16).padStart(64, "0")}`;
}

function paymasterAndData(paymaster: `0x${string}`, verificationGas: bigint, postOpGas: bigint, data: `0x${string}` = "0x") {
  const p = paymaster.toLowerCase().replace(/^0x/, "");
  const vg = verificationGas.toString(16).padStart(32, "0");
  const pg = postOpGas.toString(16).padStart(32, "0");
  const d = data.replace(/^0x/, "");
  return `0x${p}${vg}${pg}${d}`;
}

async function rawRpc(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

async function main() {
  const ENTRY = reqAddress("ENTRY_POINT_ADDRESS");
  const FACTORY = reqAddress("AA_FACTORY_ADDRESS");
  const PAYMASTER = reqAddress("AA_PAYMASTER_ADDRESS");
  const SWAPPER = reqAddress("SOVRYN_SWAPPER_ADDRESS");
  const WRBTC = reqAddress("SOVRYN_WRBTC_ADDRESS");
  const DOC = reqAddress("SOVRYN_DOC_ADDRESS");
  const BUNDLER = process.env.BUNDLER_RPC_URL?.trim();
  if (!BUNDLER) throw new Error("BUNDLER_RPC_URL faltante");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const eoa = wallets[0];
  if (!eoa) throw new Error("No wallet configurada");

  const owner = eoa.account.address;
  const sender = await pub.readContract({ address: FACTORY, abi: factoryAbi, functionName: "getAddress", args: [owner] });
  const nonce = await pub.readContract({ address: ENTRY, abi: entryPointAbi, functionName: "getNonce", args: [sender, 0n] });

  const quote = await pub.readContract({
    address: SWAPPER,
    abi: swapperAbi,
    functionName: "getAmountOut",
    args: [WRBTC, DOC, SWAP_AMOUNT],
  });
  const minAmountOut = (quote * 95n) / 100n;

  const approveCall = encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [SWAPPER, SWAP_AMOUNT] });
  const swapCall = encodeFunctionData({ abi: swapperAbi, functionName: "swap", args: [WRBTC, DOC, SWAP_AMOUNT, minAmountOut] });
  const callData = encodeFunctionData({
    abi: accountAbi,
    functionName: "executeBatch",
    args: [[WRBTC, SWAPPER], [0n, 0n], [approveCall, swapCall]],
  });

  const base = {
    sender,
    nonce: hex(nonce),
    initCode: "0x",
    callData,
  };

  const callGasLimit = 250000n;
  const verificationGasLimit = 400000n;
  const preVerificationGas = 120000n;
  const maxPriority = 1_000_000n;
  const maxFee = 60_000_000n;
  const dummySig = `0x${"00".repeat(65)}`;

  const unpackedNoPm = {
    ...base,
    callGasLimit: hex(callGasLimit),
    verificationGasLimit: hex(verificationGasLimit),
    preVerificationGas: hex(preVerificationGas),
    maxFeePerGas: hex(maxFee),
    maxPriorityFeePerGas: hex(maxPriority),
    signature: dummySig,
  };

  const unpackedWithPm = {
    ...unpackedNoPm,
    paymaster: PAYMASTER,
    paymasterVerificationGasLimit: hex(100000n),
    paymasterPostOpGasLimit: hex(100000n),
    paymasterData: "0x",
  };

  const packedNoPm = {
    ...base,
    accountGasLimits: pack128x2(verificationGasLimit, callGasLimit),
    preVerificationGas: hex(preVerificationGas),
    gasFees: pack128x2(maxPriority, maxFee),
    paymasterAndData: "0x",
    signature: dummySig,
  };

  const packedWithPm = {
    ...packedNoPm,
    paymasterAndData: paymasterAndData(PAYMASTER, 100000n, 100000n, "0x"),
  };

  const tests: Array<{ label: string; userOp: unknown }> = [
    { label: "unpacked_no_paymaster", userOp: unpackedNoPm },
    { label: "unpacked_with_paymaster", userOp: unpackedWithPm },
    { label: "packed_no_paymaster", userOp: packedNoPm },
    { label: "packed_with_paymaster", userOp: packedWithPm },
  ];

  console.log("EntryPoint:", ENTRY);
  console.log("Sender:", sender);
  console.log("Nonce:", nonce.toString(), hex(nonce));
  console.log("Bundler:", BUNDLER.split("?")[0]);

  for (const t of tests) {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_estimateUserOperationGas",
      params: [t.userOp, ENTRY],
    };

    console.log(`\n=== ${t.label} REQUEST ===`);
    console.log(JSON.stringify(payload, null, 2));

    const result = await rawRpc(BUNDLER, payload);
    console.log(`=== ${t.label} RESPONSE ===`);
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
