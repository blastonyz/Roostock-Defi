/**
 * check-sovryn-swap.ts
 * Verifica si el Sovryn Protocol tiene swap AMM disponible (swapExternal)
 * Esto es diferente al margin trading - usa liquidity pools directamente
 */
import "dotenv/config";
import { network } from "hardhat";
import { getAddress, formatUnits, parseUnits, isAddress } from "viem";

const sovrynProtocolAbi = [
  // swapExternal: AMM swap directo, no requiere oracle de margin
  {
    type: "function",
    name: "swapExternal",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "sourceToken" },
      { type: "address", name: "destToken" },
      { type: "address", name: "receiver" },
      { type: "address", name: "returnToSender" },
      { type: "uint256", name: "sourceTokenAmount" },
      { type: "uint256", name: "requiredDestTokenAmount" },
      { type: "uint256", name: "minReturn" },
      { type: "bytes", name: "swapData" },
    ],
    outputs: [
      { type: "uint256", name: "destTokenAmountReceived" },
      { type: "uint256", name: "sourceTokenAmountUsed" },
    ],
  },
  // getSwapExpectedReturn: estimacion del swap AMM
  {
    type: "function",
    name: "getSwapExpectedReturn",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "sourceToken" },
      { type: "address", name: "destToken" },
      { type: "uint256", name: "sourceTokenAmount" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const wallet = wallets[0];
  if (!wallet) throw new Error("No hay wallet");

  const PROTOCOL = getAddress(process.env.SOVRYN_PROTOCOL_ADDRESS!);
  const WRBTC = getAddress(process.env.SOVRYN_WRBTC_ADDRESS!);
  const DOC = getAddress(process.env.SOVRYN_DOC_ADDRESS!);
  const account = wallet.account.address;

  console.log("=== Sovryn AMM Swap Check ===\n");

  // Balance actual
  const wrbtcBal = await pub.readContract({ address: WRBTC, abi: erc20Abi, functionName: "balanceOf", args: [account] });
  console.log(`WRBTC balance: ${formatUnits(wrbtcBal, 18)}`);

  const amountIn = parseUnits("0.0001", 18);

  // Intentar getSwapExpectedReturn
  console.log("\nProbando getSwapExpectedReturn (AMM directo)...");
  try {
    const expected = await pub.readContract({
      address: PROTOCOL,
      abi: sovrynProtocolAbi,
      functionName: "getSwapExpectedReturn",
      args: [WRBTC, DOC, amountIn],
    });
    console.log(`✅ Quote AMM: ${formatUnits(amountIn, 18)} WRBTC → ${formatUnits(expected, 18)} DoC`);
    console.log("\nEl swap AMM (swapExternal) debería funcionar!");
  } catch (e: any) {
    const msg = e?.shortMessage ?? e?.message ?? String(e);
    console.log(`❌ getSwapExpectedReturn revirtió: ${msg.slice(0, 200)}`);
    console.log("\nEl AMM de Sovryn tampoco está disponible en testnet.");
  }
}

main().catch(console.error);
