import "dotenv/config";
import { network } from "hardhat";
import { parseUnits, getAddress } from "viem";

async function main() {
  const to = getAddress("0xd2cC68586C62681D3c8eB2289123bC99EE033Dec");
  const amount = parseUnits("0.0001", 18);

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const eoa = wallets[0];
  if (!eoa) throw new Error("No wallet configurada");

  const tx = await eoa.sendTransaction({ to, value: amount });
  await pub.waitForTransactionReceipt({ hash: tx });

  const bal = await pub.getBalance({ address: to });
  console.log("fund tx:", tx);
  console.log("smart account new balance:", bal.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
