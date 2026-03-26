import "dotenv/config";
import { network } from "hardhat";
import { getAddress, formatUnits } from "viem";

const entryPointAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const eoa = wallets[0]!;

  const EP = getAddress(process.env.ENTRY_POINT_ADDRESS!);
  const eoaBal = await pub.getBalance({ address: eoa.account.address });

  console.log("EOA balance:", formatUnits(eoaBal, 18), "tRBTC");

  const toCheck = [
    ["Paymaster viejo (EXISTING)", process.env.EXISTING_PAYMASTER_ADDRESS],
    ["Paymaster nuevo (AA_PAYMASTER)", process.env.AA_PAYMASTER_ADDRESS],
  ];

  for (const [label, addr] of toCheck) {
    if (!addr) { console.log(`${label}: no definido`); continue; }
    try {
      const dep = await pub.readContract({ address: EP, abi: entryPointAbi, functionName: "balanceOf", args: [getAddress(addr)] });
      console.log(`${label}: ${formatUnits(dep, 18)} tRBTC deposited`);
    } catch (e) {
      console.log(`${label}: error`, (e as Error).message?.slice(0, 80));
    }
  }
}

main().catch(console.error);
