import "dotenv/config";
import { network } from "hardhat";
import { formatUnits, getAddress, parseUnits } from "viem";

const pfAbi = [
  {
    type: "function", name: "queryReturn", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
    outputs: [{ type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "function", name: "queryRate", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "uint256" }, { type: "uint256" }],
  },
] as const;

const protocolAbi = [
  {
    type: "function", name: "queryReturn", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  const pf = "0x7f38c422b99075f63C9c919ECD200DF8d2Cf5BD4" as `0x${string}`;
  const wrbtc = getAddress(process.env.SOVRYN_WRBTC_ADDRESS!.toLowerCase()) as `0x${string}`;
  const doc = getAddress(process.env.SOVRYN_DOC_ADDRESS!.toLowerCase()) as `0x${string}`;
  const protocol = getAddress(process.env.SOVRYN_PROTOCOL_ADDRESS!.toLowerCase()) as `0x${string}`;

  const oneWRBTC = parseUnits("1", 18);
  const oneDoC = parseUnits("1", 18);

  // Try priceFeeds.queryReturn directly
  console.log("=== PriceFeeds.queryReturn ===");
  for (const [src, dst, amt, label] of [
    [wrbtc, doc, oneWRBTC, "1 WRBTC → DoC"],
    [doc, wrbtc, oneDoC, "1 DoC → WRBTC"],
  ] as const) {
    try {
      const [toAmt, prec] = await pub.readContract({ address: pf, abi: pfAbi, functionName: "queryReturn", args: [src, dst, amt] });
      console.log(`${label}: ${formatUnits(toAmt, 18)} (prec=${prec})`);
    } catch (e: any) {
      const msg = e.message?.slice(0, 150) ?? "unknown";
      console.log(`${label}: REVERT → ${msg}`);
    }
  }

  // Try protocol.queryReturn
  console.log("\n=== Protocol.queryReturn ===");
  for (const [src, dst, amt, label] of [
    [wrbtc, doc, oneWRBTC, "1 WRBTC → DoC"],
    [doc, wrbtc, oneDoC, "1 DoC → WRBTC"],
    [wrbtc, doc, 4n * 10n ** 14n, "0.0004 WRBTC → DoC"],
  ] as const) {
    try {
      const result = await pub.readContract({ address: protocol, abi: protocolAbi, functionName: "queryReturn", args: [src, dst, amt] });
      console.log(`${label}: ${formatUnits(result, 18)}`);
    } catch (e: any) {
      const msg = (e.details ?? e.message ?? "?").slice(0, 150);
      console.log(`${label}: REVERT → ${msg}`);
    }
  }
}

main().catch(console.error);
