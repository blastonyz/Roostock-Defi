import "dotenv/config";

import { network } from "hardhat";
import { getAddress, isAddress } from "viem";

const requiredEnv = {
  iDOC: process.env.SOVRYN_IDOC_ADDRESS,
  iRBTC: process.env.SOVRYN_IRBTC_ADDRESS,
  DoC: process.env.SOVRYN_DOC_ADDRESS,
  WRBTC: process.env.SOVRYN_WRBTC_ADDRESS,
  sovrynProtocol: process.env.SOVRYN_PROTOCOL_ADDRESS,
} as const;

type Key = keyof typeof requiredEnv;

function requireAddress(name: Key): `0x${string}` {
  const value = requiredEnv[name];
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`${name} inválida o faltante en .env`);
  }
  return getAddress(value.toLowerCase()) as `0x${string}`;
}

const erc20Abi = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

const loanTokenAbi = [
  {
    type: "function",
    name: "loanTokenAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "getEstimatedMarginDetails",
    stateMutability: "view",
    inputs: [
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "address" },
    ],
    outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
  },
] as const;

async function printContractStatus(
  publicClient: Awaited<ReturnType<(typeof network)["connect"]>>["viem"] extends infer V
    ? V extends { getPublicClient: (...args: never[]) => Promise<infer C> }
      ? C
      : never
    : never,
  label: string,
  address: `0x${string}`,
) {
  const code = await publicClient.getBytecode({ address });
  const hasCode = !!code && code !== "0x";
  console.log(`${label}: ${address}`);
  console.log(`  bytecode: ${hasCode ? "OK" : "MISSING"}`);
}

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  const iDOC = requireAddress("iDOC");
  const iRBTC = requireAddress("iRBTC");
  const doc = requireAddress("DoC");
  const wrbtc = requireAddress("WRBTC");
  const sovrynProtocol = requireAddress("sovrynProtocol");

  console.log("Verificando contratos Sovryn en Rootstock testnet...\n");

  await printContractStatus(publicClient, "iDOC", iDOC);
  await printContractStatus(publicClient, "iRBTC", iRBTC);
  await printContractStatus(publicClient, "DoC", doc);
  await printContractStatus(publicClient, "WRBTC", wrbtc);
  await printContractStatus(publicClient, "SovrynProtocol", sovrynProtocol);

  console.log("\nMetadata tokens:");
  const [docSymbol, docDecimals] = await Promise.all([
    publicClient.readContract({ address: doc, abi: erc20Abi, functionName: "symbol" }),
    publicClient.readContract({ address: doc, abi: erc20Abi, functionName: "decimals" }),
  ]);

  const [wrbtcSymbol, wrbtcDecimals] = await Promise.all([
    publicClient.readContract({ address: wrbtc, abi: erc20Abi, functionName: "symbol" }),
    publicClient.readContract({ address: wrbtc, abi: erc20Abi, functionName: "decimals" }),
  ]);

  console.log(`  DoC   -> ${docSymbol} (${docDecimals} dec)`);
  console.log(`  WRBTC -> ${wrbtcSymbol} (${wrbtcDecimals} dec)`);

  try {
    const [iDocUnderlying, iRbtcUnderlying] = await Promise.all([
      publicClient.readContract({
        address: iDOC,
        abi: loanTokenAbi,
        functionName: "loanTokenAddress",
      }),
      publicClient.readContract({
        address: iRBTC,
        abi: loanTokenAbi,
        functionName: "loanTokenAddress",
      }),
    ]);

    console.log("\nUnderlyings reportados por iTokens:");
    console.log(`  iDOC  -> ${iDocUnderlying}`);
    console.log(`  iRBTC -> ${iRbtcUnderlying}`);
  } catch {
    console.log("\nNo se pudo leer loanTokenAddress() en uno o ambos iTokens (ABI distinta o proxy no compatible). ");
  }

  try {
    const estimate = await publicClient.readContract({
      address: iRBTC,
      abi: loanTokenAbi,
      functionName: "getEstimatedMarginDetails",
      args: [1n, 1n, 1n, wrbtc],
    });
    console.log("\niRBTC.getEstimatedMarginDetails() responde OK:");
    console.log(`  posibleSize=${estimate[0]} minReturn=${estimate[1]} collateralNeeded=${estimate[2]}`);
  } catch {
    console.log("\niRBTC no respondió getEstimatedMarginDetails() con esta ABI/parámetros.");
  }

  console.log("\nVerificación completada ✅");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
