import "dotenv/config";
import { network } from "hardhat";
import { parseEther } from "viem";

async function main() {
  const paymasterAddress = process.env.AA_PAYMASTER_ADDRESS as `0x${string}` | undefined;
  if (!paymasterAddress) throw new Error("AA_PAYMASTER_ADDRESS faltante");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  const paymaster = await viem.getContractAt("PaymasterV06", paymasterAddress);
  const amount = parseEther("0.0002");

  const tx = await paymaster.write.deposit({ value: amount });
  await pub.waitForTransactionReceipt({ hash: tx });

  console.log("✅ deposit tx:", tx);
  console.log("amount:", amount.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
