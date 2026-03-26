/**
 * verify-uniswap-rsk.ts
 * Check Uniswap availability on RSK testnet
 */
import "dotenv/config";
import { network } from "hardhat";
import { getAddress } from "viem";

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  console.log("=== Uniswap on RSK Testnet ===\n");

  // Common Uniswap addresses across networks
  const candidates = {
    "UniswapV2Router02": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "UniswapV2Factory": "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    "UniswapV3Router": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    "UniswapV3Factory": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "WETH9": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  };

  console.log("Checking standard Uniswap addresses...\n");

  for (const [name, addr] of Object.entries(candidates)) {
    try {
      const code = await pub.getBytecode({ address: getAddress(addr) as `0x${string}` });
      const hasCode = code !== "0x";
      console.log(`${name.padEnd(20)} ${addr}: ${hasCode ? "✅ EXISTS" : "❌ EMPTY"}`);
    } catch (e) {
      console.log(`${name.padEnd(20)} ${addr}: ⚠️ ERROR`);
    }
  }

  // Check for testnet-specific deployments
  console.log("\n=== Looking for Uniswap on RSK Community ===");
  console.log("Visit: https://github.com/uniswap/uniswap-v2-core/tree/master/migrations");
  console.log("Or: https://docs.uniswap.org/contracts/v2/reference/smart-contracts");
}

main().catch(console.error);
