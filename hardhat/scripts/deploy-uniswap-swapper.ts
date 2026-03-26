import "dotenv/config";
import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();
  const walletClients = await viem.getWalletClients();
  const deployer = walletClients[0];

  if (!deployer) {
    throw new Error("No hay wallet para deploy. Configura RSK_PRIVATE_KEY en .env");
  }

  console.log("Deployer:", deployer.account.address);
  console.log("Deploying UniswapSwapper...");

  const contract = await viem.deployContract("UniswapSwapper", []);

  console.log("UniswapSwapper deployed at:", contract.address);
  console.log("\nAdd to .env:");
  console.log(`UNISWAP_SWAPPER_ADDRESS=${contract.address}`);
}

main().catch(console.error);
