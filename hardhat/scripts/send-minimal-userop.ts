import "dotenv/config";
import { network } from "hardhat";
import { encodeAbiParameters, encodeFunctionData, getAddress, isAddress, keccak256 } from "viem";

const factoryAbi = [
  { type: "function", name: "getAddress", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
] as const;

const entryPointAbi = [
  { type: "function", name: "getNonce", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint192" }], outputs: [{ type: "uint256" }] },
] as const;

const accountAbi = [
  { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }, { type: "bytes" }], outputs: [] },
] as const;

function reqAddress(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value || !isAddress(value, { strict: false })) throw new Error(`${name} inválida o faltante`);
  return getAddress(value);
}

function pack128x2(high: bigint, low: bigint): `0x${string}` {
  return `0x${((high << 128n) | low).toString(16).padStart(64, "0")}`;
}

function toHex(n: bigint): `0x${string}` {
  return `0x${n.toString(16)}`;
}

function computeUserOpHash(userOp: {
  sender: `0x${string}`;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  accountGasLimits: `0x${string}`;
  preVerificationGas: bigint;
  gasFees: `0x${string}`;
  paymasterAndData: `0x${string}`;
}, entryPoint: `0x${string}`, chainId: bigint): `0x${string}` {
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
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      keccak256(userOp.paymasterAndData),
    ],
  );

  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
      [keccak256(packed), entryPoint, chainId],
    ),
  );
}

async function bundlerRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`HTTP ${response.status} ${response.statusText} | body: ${raw}`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText} | body: ${raw}`);
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result as T;
}

async function main() {
  const ENTRY = reqAddress("ENTRY_POINT_ADDRESS");
  const FACTORY = reqAddress("AA_FACTORY_ADDRESS");
  const BUNDLER = (process.env.BUNDLER_RPC_URL ?? "").trim();
  if (!BUNDLER) throw new Error("BUNDLER_RPC_URL faltante");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const eoa = wallets[0];
  if (!eoa) throw new Error("No wallet configurada");

  const owner = eoa.account.address;
  const sender = await pub.readContract({ address: FACTORY, abi: factoryAbi, functionName: "getAddress", args: [owner] });
  const nonce = await pub.readContract({ address: ENTRY, abi: entryPointAbi, functionName: "getNonce", args: [sender, 0n] });
  const chainId = BigInt(await pub.getChainId());

  const callData = encodeFunctionData({
    abi: accountAbi,
    functionName: "execute",
    args: [owner, 0n, "0x"],
  });

  const verificationGas = 700000n;
  const callGas = 500000n;
  const preVer = 200000n;
  const maxPrio = 2_000_000n;
  const maxFee = 2_000_000n;
  const hashInput = {
    sender,
    nonce,
    initCode: "0x" as `0x${string}`,
    callData,
    accountGasLimits: pack128x2(verificationGas, callGas),
    preVerificationGas: preVer,
    gasFees: pack128x2(maxPrio, maxFee),
    paymasterAndData: "0x" as `0x${string}`,
  };

  const userOpHash = computeUserOpHash(hashInput, ENTRY, chainId);
  const signature = await eoa.signMessage({ message: { raw: userOpHash } });

  const userOp = {
    sender,
    nonce: toHex(nonce),
    initCode: "0x",
    callData,
    callGasLimit: toHex(callGas),
    verificationGasLimit: toHex(verificationGas),
    preVerificationGas: toHex(preVer),
    maxFeePerGas: toHex(maxFee),
    maxPriorityFeePerGas: toHex(maxPrio),
    signature,
  };

  console.log("Sending minimal userOp...");
  console.log(JSON.stringify({ entryPoint: ENTRY, sender, nonce: userOp.nonce }, null, 2));

  const opHash = await bundlerRpc<string>(BUNDLER, "eth_sendUserOperation", [userOp, ENTRY]);
  console.log("opHash:", opHash);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
