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
  {
    type: "function",
    name: "getUserOpHash",
    stateMutability: "view",
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
  { type: "function", name: "getAmountOut", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "swap", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

function reqAddress(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value || !isAddress(value, { strict: false })) throw new Error(`${name} inválida o faltante`);
  return getAddress(value);
}

function hex(n: bigint) {
  return `0x${n.toString(16)}` as `0x${string}`;
}

function pack128x2(high: bigint, low: bigint) {
  return `0x${((high << 128n) | low).toString(16).padStart(64, "0")}` as `0x${string}`;
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

  const callGasLimit = 250000n;
  const verificationGasLimit = 400000n;
  const preVerificationGas = 120000n;
  const maxPriority = 1_000_000n;
  const maxFee = 60_000_000n;

  const packed = {
    sender,
    nonce,
    initCode: "0x" as `0x${string}`,
    callData,
    accountGasLimits: pack128x2(verificationGasLimit, callGasLimit),
    preVerificationGas,
    gasFees: pack128x2(maxPriority, maxFee),
    paymasterAndData: "0x" as `0x${string}`,
    signature: "0x" as `0x${string}`,
  };

  const userOpHash = await pub.readContract({
    address: ENTRY,
    abi: entryPointAbi,
    functionName: "getUserOpHash",
    args: [packed],
  });

  const sig = await eoa.signMessage({ message: { raw: userOpHash } });

  const unpackedSigned = {
    sender,
    nonce: hex(nonce),
    initCode: "0x",
    callData,
    callGasLimit: hex(callGasLimit),
    verificationGasLimit: hex(verificationGasLimit),
    preVerificationGas: hex(preVerificationGas),
    maxFeePerGas: hex(maxFee),
    maxPriorityFeePerGas: hex(maxPriority),
    signature: sig,
  };

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_estimateUserOperationGas",
    params: [unpackedSigned, ENTRY],
  };

  console.log("EntryPoint:", ENTRY);
  console.log("Sender:", sender);
  console.log("Nonce:", nonce.toString(), hex(nonce));
  console.log("UserOpHash:", userOpHash);
  console.log("\n=== signed_unpacked REQUEST ===");
  console.log(JSON.stringify(payload, null, 2));

  const res = await rawRpc(BUNDLER, payload);
  console.log("=== signed_unpacked RESPONSE ===");
  console.log(JSON.stringify(res, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
