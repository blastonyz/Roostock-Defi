/**
 * deploy-aa.ts
 * Despliega AccountFactory (con executeBatch) y Paymaster
 * Fondea el Paymaster en el EntryPoint para sponsorear gas
 */
import "dotenv/config";
import { network } from "hardhat";
import { isAddress, parseEther } from "viem";

async function main() {
  const entryPoint = process.env.ENTRY_POINT_ADDRESS;
  if (!entryPoint || !isAddress(entryPoint)) throw new Error("ENTRY_POINT_ADDRESS inválida en .env");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const deployer = wallets[0];
  if (!deployer) throw new Error("No hay wallet. Configura RSK_PRIVATE_KEY en .env");

  const balance = await pub.getBalance({ address: deployer.account.address });
  console.log("Deployer:", deployer.account.address);
  console.log("Balance tRBTC:", (Number(balance) / 1e18).toFixed(6));

  // Deploy AccountFactory
  console.log("\n[1/3] Deploying AccountFactory...");
  const factory = await viem.deployContract("AccountFactory", [entryPoint as `0x${string}`]);
  console.log("AccountFactory:", factory.address);

  // Deploy Paymaster
  console.log("\n[2/3] Deploying Paymaster...");
  const paymaster = await viem.deployContract("Paymaster", [entryPoint as `0x${string}`]);
  console.log("Paymaster:", paymaster.address);

  // Fund Paymaster in EntryPoint
  console.log("\n[3/3] Fondeando Paymaster en EntryPoint...");
  const deposit = parseEther("0.0002");

  const afterDeploys = await pub.getBalance({ address: deployer.account.address });
  if (afterDeploys < deposit + parseEther("0.0002")) {
    console.log("⚠️  Balance bajo, saltando depósito. Consigue tRBTC en: https://faucet.rootstock.io/");
  } else {
    const tx = await paymaster.write.deposit({ value: deposit });
    await pub.waitForTransactionReceipt({ hash: tx });
    console.log("✅ Paymaster fondeado con", (Number(deposit) / 1e18).toFixed(4), "tRBTC. tx:", tx);
  }

  console.log("\n=== Add to .env ===");
  console.log(`AA_FACTORY_ADDRESS=${factory.address}`);
  console.log(`AA_PAYMASTER_ADDRESS=${paymaster.address}`);
}

main().catch(console.error);
