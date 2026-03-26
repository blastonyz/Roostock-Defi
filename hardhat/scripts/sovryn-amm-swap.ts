import "dotenv/config";
import { network } from "hardhat";
import { getAddress, isAddress, parseUnits, formatUnits } from "viem";

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
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const swapperAbi = [
  {
    type: "function",
    name: "getAmountOut",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "tokenIn" },
      { type: "address", name: "tokenOut" },
      { type: "uint256", name: "amountIn" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "swap",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "tokenIn" },
      { type: "address", name: "tokenOut" },
      { type: "uint256", name: "amountIn" },
      { type: "uint256", name: "minAmountOut" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function main() {
  const swapperAddr = process.env.SOVRYN_SWAPPER_ADDRESS;
  if (!swapperAddr || !isAddress(swapperAddr)) throw new Error("SOVRYN_SWAPPER_ADDRESS no definido en .env");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const wallet = walletClients[0];
  if (!wallet) throw new Error("No hay wallet configurada");

  const account = wallet.account.address;
  console.log("Wallet:", account);

  const WRBTC = getAddress(process.env.SOVRYN_WRBTC_ADDRESS!);
  const DOC = getAddress(process.env.SOVRYN_DOC_ADDRESS!);
  const swapper = getAddress(swapperAddr);

  // Check WRBTC balance
  const balance = await pub.readContract({
    address: WRBTC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
  });
  console.log("WRBTC balance:", formatUnits(balance, 18));

  if (balance === 0n) {
    console.log("❌ No hay WRBTC. Wrap tRBTC primero.");
    return;
  }

  // Get quote
  const amountIn = parseUnits("0.0001", 18);
  const quote = await pub.readContract({
    address: swapper,
    abi: swapperAbi,
    functionName: "getAmountOut",
    args: [WRBTC, DOC, amountIn],
  });
  console.log(`Quote: ${formatUnits(amountIn, 18)} WRBTC → ${formatUnits(quote, 18)} DoC`);

  // Approve
  console.log("\n[1/3] Aprobando WRBTC al swapper...");
  const approveTxHash = await wallet.writeContract({
    address: WRBTC,
    abi: erc20Abi,
    functionName: "approve",
    args: [swapper, amountIn],
  });
  await pub.waitForTransactionReceipt({ hash: approveTxHash });
  console.log("✅ Aprobado");

  // Swap with 2% slippage
  console.log("\n[2/3] Ejecutando swap via Sovryn AMM...");
  const minAmountOut = (quote * 98n) / 100n; // 2% slippage
  const swapTxHash = await wallet.writeContract({
    address: swapper,
    abi: swapperAbi,
    functionName: "swap",
    args: [WRBTC, DOC, amountIn, minAmountOut],
  });
  await pub.waitForTransactionReceipt({ hash: swapTxHash });
  console.log("✅ Swap ejecutado:", swapTxHash);

  // Check DoC balance
  console.log("\n[3/3] Verificando balance DoC...");
  const docBalance = await pub.readContract({
    address: DOC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
  });
  console.log("DoC balance:", formatUnits(docBalance, 18));

  console.log("\n✅ Swap completo! WRBTC → DoC via Sovryn AMM");
}

main().catch(console.error);
