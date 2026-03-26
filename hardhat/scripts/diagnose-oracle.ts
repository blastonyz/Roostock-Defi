import "dotenv/config";
import { network } from "hardhat";
import { formatUnits, getAddress } from "viem";

const priceFeedsAbi = [
  {
    type: "function", name: "queryRate", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "uint256", name: "rate" }, { type: "uint256", name: "precision" }],
  },
  {
    type: "function", name: "hasOracle", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const protocolAbi = [
  {
    type: "function", name: "priceFeeds", stateMutability: "view",
    inputs: [], outputs: [{ type: "address" }],
  },
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

  console.log("PriceFeeds:", pf);
  console.log("WRBTC:", wrbtc);
  console.log("DoC:  ", doc);

  // Test hasOracle
  for (const [a, b, label] of [[wrbtc, doc, "WRBTC,DoC"], [doc, wrbtc, "DoC,WRBTC"]] as const) {
    const has = await pub.readContract({ address: pf, abi: priceFeedsAbi, functionName: "hasOracle", args: [a, b] }).catch(() => "REVERT");
    console.log(`hasOracle(${label}):`, has);
  }

  // Test queryRate directly
  for (const [a, b, label] of [[wrbtc, doc, "WRBTC→DoC"], [doc, wrbtc, "DoC→WRBTC"]] as const) {
    try {
      const [rate, prec] = await pub.readContract({ address: pf, abi: priceFeedsAbi, functionName: "queryRate", args: [a, b] });
      const formattedRate = prec > 0n ? (Number(rate) / Number(prec)).toFixed(6) : formatUnits(rate, 18);
      console.log(`queryRate(${label}): rate=${rate.toString()} prec=${prec.toString()} → ${formattedRate}`);
    } catch (e: any) {
      console.log(`queryRate(${label}): REVERT - ${e.message?.slice(0, 100) ?? "?"}`);
    }
  }

  // Test protocol queryReturn with explicit amounts
  const testAmounts = [
    { src: wrbtc, dst: doc, amount: 10n ** 18n, label: "1 WRBTC→DoC" },
    { src: doc, dst: wrbtc, amount: 10n ** 21n, label: "1000 DoC→WRBTC" },
  ];
  for (const { src, dst, amount, label } of testAmounts) {
    try {
      const result = await pub.readContract({ address: protocol, abi: protocolAbi, functionName: "queryReturn", args: [src, dst, amount] });
      console.log(`queryReturn(${label}): ${formatUnits(result, 18)}`);
    } catch (e: any) {
      console.log(`queryReturn(${label}): REVERT - ${e.message?.slice(0, 100) ?? "?"}`);
    }
  }
}

main().catch(console.error);
