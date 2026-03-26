import "dotenv/config";

import { network } from "hardhat";
import { isAddress, parseEther } from "viem";

const DEFAULT_ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;

const entryPoint = (process.env.ENTRY_POINT_ADDRESS ?? DEFAULT_ENTRY_POINT) as `0x${string}`;
if (!isAddress(entryPoint)) {
  throw new Error("ENTRY_POINT_ADDRESS inválida en .env");
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const walletClients = await viem.getWalletClients();
const deployer = walletClients[0];

if (!deployer) {
  throw new Error(
    "No hay cuenta configurada para firmar. Configura RSK_PRIVATE_KEY en .env (sin 0x) y vuelve a ejecutar el script.",
  );
}

console.log("Network listo. Deployer:", deployer.account.address);
console.log("EntryPoint:", entryPoint);

const factory = await viem.deployContract("AccountFactory", [entryPoint]);
console.log("AccountFactory desplegado en:", factory.address);

const paymaster = await viem.deployContract("Paymaster", [entryPoint]);
console.log("Paymaster desplegado en:", paymaster.address);

const smartAccountAddress = await factory.read.getAddress([deployer.account.address]);
console.log("Smart account esperada (counterfactual):", smartAccountAddress);

const createHash = await factory.write.createAccount([deployer.account.address]);
await publicClient.waitForTransactionReceipt({ hash: createHash });
console.log("Smart account creada. tx:", createHash);

const fundHash = await deployer.sendTransaction({
  to: smartAccountAddress,
  value: parseEther("0.0005"),
});
await publicClient.waitForTransactionReceipt({ hash: fundHash });
console.log("Smart account fondeada. tx:", fundHash);

const entryPointCode = await publicClient.getBytecode({ address: entryPoint });
if (entryPointCode && entryPointCode !== "0x") {
  const depositHash = await paymaster.write.deposit({
    value: parseEther("0.0005"),
  });
  await publicClient.waitForTransactionReceipt({ hash: depositHash });
  console.log("Paymaster depositado en EntryPoint. tx:", depositHash);
} else {
  console.log("EntryPoint no encontrado en esta red. Se omite depósito del Paymaster.");
}

const smartAccountBalance = await publicClient.getBalance({ address: smartAccountAddress });
console.log("Balance smart account:", smartAccountBalance.toString());

console.log("Flujo AA base completado ✅");
