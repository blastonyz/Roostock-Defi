import "dotenv/config";
import { network } from "hardhat";
import { formatUnits, getAddress } from "viem";

async function main() {
  const ENTRY_POINT = getAddress(process.env.ENTRY_POINT_ADDRESS || "0x48e60BBb664aEfAc9f14aDB42e5FB5b4a119EB66");
  const PAYMASTER = getAddress(process.env.AA_PAYMASTER_ADDRESS || "");
  const SMART_ACCOUNT = getAddress("0xd2cC68586C62681D3c8eB2289123bC99EE033Dec");

  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  console.log("\n=== Quick Balance Check ===\n");

  // Smart Account native
  const bal = await publicClient.getBalance({ address: SMART_ACCOUNT });
  console.log(`Smart Account native: ${formatUnits(bal, 18)} tRBTC`);

  // Paymaster deposit in EntryPoint
  try {
    const pmDeposit = await publicClient.readContract({
      address: ENTRY_POINT,
      abi: [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }] as const,
      functionName: "balanceOf",
      args: [PAYMASTER],
    });
    console.log(`Paymaster deposit: ${formatUnits(pmDeposit, 18)} tRBTC`);
  } catch (e) {
    console.log(`Paymaster deposit: Could not read`);
  }
}

main().catch(console.error);
