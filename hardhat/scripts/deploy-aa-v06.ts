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

  console.log("\n[1/3] Deploying AccountFactoryV06...");
  const factory = await viem.deployContract("AccountFactoryV06", [entryPoint as `0x${string}`]);
  console.log("AccountFactoryV06:", factory.address);

  console.log("\n[2/3] Deploying PaymasterV06...");
  const paymaster = await viem.deployContract("PaymasterV06", [entryPoint as `0x${string}`]);
  console.log("PaymasterV06:", paymaster.address);

  console.log("\n[3/3] Funding PaymasterV06 in EntryPoint...");
  const deposit = parseEther("0.0002");
  const afterDeploys = await pub.getBalance({ address: deployer.account.address });

  if (afterDeploys < deposit + parseEther("0.0002")) {
    console.log("⚠️ Balance bajo, saltando depósito");
  } else {
    const tx = await paymaster.write.deposit({ value: deposit });
    await pub.waitForTransactionReceipt({ hash: tx });
    console.log("✅ Paymaster fondeado. tx:", tx);
  }

  console.log("\n=== Update .env ===");
  console.log(`EXISTING_FACTORY_ADDRESS=${factory.address}`);
  console.log(`AA_FACTORY_ADDRESS=${factory.address}`);
  console.log(`EXISTING_PAYMASTER_ADDRESS=${paymaster.address}`);
  console.log(`AA_PAYMASTER_ADDRESS=${paymaster.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
