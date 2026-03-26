import "dotenv/config";
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying UniswapSwapper...");

  const UniswapSwapper = await ethers.getContractFactory("UniswapSwapper");
  const swapper = await UniswapSwapper.deploy();

  await swapper.waitForDeployment();
  const address = await swapper.getAddress();

  console.log("UniswapSwapper deployed at:", address);
  console.log("\nAdd to .env:");
  console.log(`UNISWAP_SWAPPER_ADDRESS=${address}`);
}

main().catch(console.error);
