import "dotenv/config";
import { network } from "hardhat";
import { getAddress } from "viem";

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  const account = getAddress("0xd2cC68586C62681D3c8eB2289123bC99EE033Dec");
  const owner = await pub.readContract({
    address: account,
    abi: [{ type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
    functionName: "owner",
  });

  console.log("Account.owner():", owner);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
