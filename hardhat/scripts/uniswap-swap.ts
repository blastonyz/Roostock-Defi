import "dotenv/config";
import { ethers } from "hardhat";
import { parseUnits, formatUnits } from "viem";

async function main() {
  const swapperAddr = process.env.UNISWAP_SWAPPER_ADDRESS;
  if (!swapperAddr) throw new Error("UNISWAP_SWAPPER_ADDRESS not in .env");

  const [signer] = await ethers.getSigners();
  console.log("Swapper:", signer.address);

  // Token addresses on RSK testnet
  // WRBTC = 0x69fE5cEc81D5eF92600c1a0dB1F11986AB3758ab (WETH equivalent)
  // DoC = 0xCB46C0DdC60d18eFEB0E586C17Af6ea36452DaE0
  const WRBTC = "0x69fE5cEc81D5eF92600c1a0dB1F11986AB3758ab";
  const DOC = "0xCB46C0DdC60d18eFEB0E586C17Af6ea36452DaE0";

  const swapper = await ethers.getContractAt("UniswapSwapper", swapperAddr);

  // Get signer's WRBTC balance
  const wrbtcToken = await ethers.getContractAt("IERC20", WRBTC);
  const balance = await wrbtcToken.balanceOf(signer.address);
  console.log("WRBTC balance:", formatUnits(balance, 18));

  if (balance === 0n) {
    console.log("❌ No WRBTC balance. Get tRBTC and wrap it first.");
    return;
  }

  // Get quote for 0.0001 WRBTC -> DoC
  const amountIn = parseUnits("0.0001", 18);
  const quote = await swapper.getAmountOut(WRBTC, DOC, amountIn);
  console.log(`Quote: ${formatUnits(amountIn, 18)} WRBTC → ${formatUnits(quote, 18)} DoC`);

  // Approve
  console.log("\n[1/3] Approving WRBTC...");
  const approveTx = await wrbtcToken.approve(swapperAddr, amountIn);
  await approveTx.wait();
  console.log("✅ Approved");

  // Swap with 1% slippage
  console.log("\n[2/3] Executing swap...");
  const minAmountOut = (quote * 99n) / 100n; // 1% slippage
  const swapTx = await swapper.swap(WRBTC, DOC, amountIn, minAmountOut);
  const swapReceipt = await swapTx.wait();
  console.log("✅ Swap executed:", swapReceipt?.hash);

  // Check DoC balance
  console.log("\n[3/3] Checking balance...");
  const docToken = await ethers.getContractAt("IERC20", DOC);
  const docBalance = await docToken.balanceOf(signer.address);
  console.log("DoC balance:", formatUnits(docBalance, 18));

  console.log("\n✅ Swap complete!");
}

main().catch(console.error);
