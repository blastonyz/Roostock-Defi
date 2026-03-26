import "dotenv/config";
import { network } from "hardhat";
import { parseEther, getAddress, isAddress } from "viem";

function reqAddress(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value || !isAddress(value, { strict: false })) throw new Error(`${name} inválida o faltante`);
  return getAddress(value);
}

async function main() {
  const PAYMASTER = reqAddress("AA_PAYMASTER_ADDRESS");
  const amount = parseEther("0.00005");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const eoa = wallets[0];
  if (!eoa) throw new Error("No wallet configurada");

  const tx = await eoa.writeContract({
    address: PAYMASTER,
    abi: [
      {
        type: "function",
        name: "deposit",
        stateMutability: "payable",
        inputs: [],
        outputs: [],
      },
    ] as const,
    functionName: "deposit",
    value: amount,
  });

  await pub.waitForTransactionReceipt({ hash: tx });
  console.log("deposit tx:", tx);

  const entryPoint = reqAddress("ENTRY_POINT_ADDRESS");
  const deposit = await pub.readContract({
    address: entryPoint,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ] as const,
    functionName: "balanceOf",
    args: [PAYMASTER],
  });

  console.log("paymaster entrypoint deposit:", deposit.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
