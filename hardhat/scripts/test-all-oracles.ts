import "dotenv/config";
import { network } from "hardhat";
import { formatUnits, getAddress, parseUnits } from "viem";

const protocolAbi = [
  {
    type: "function",
    name: "queryReturn",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

interface TokenPair {
  name: string;
  src: string;
  dst: string;
  amount: bigint;
  label: string;
}

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  const protocol = getAddress(process.env.SOVRYN_PROTOCOL_ADDRESS!.toLowerCase()) as `0x${string}`;
  const wrbtc = getAddress(process.env.SOVRYN_WRBTC_ADDRESS!.toLowerCase()) as `0x${string}`;
  const doc = getAddress(process.env.SOVRYN_DOC_ADDRESS!.toLowerCase()) as `0x${string}`;
  const iRBTC = getAddress(process.env.SOVRYN_IRBTC_ADDRESS!.toLowerCase()) as `0x${string}`;
  const iDOC = getAddress(process.env.SOVRYN_IDOC_ADDRESS!.toLowerCase()) as `0x${string}`;

  console.log("=== Testing Oracle Pairs (Protocol.queryReturn) ===\n");

  const pairs: TokenPair[] = [
    // Loan tokens (iDOC, iRBTC)
    { name: "iDOC→iRBTC", src: iDOC, dst: iRBTC, amount: parseUnits("1", 18), label: "1 iDOC" },
    { name: "iRBTC→iDOC", src: iRBTC, dst: iDOC, amount: parseUnits("1", 18), label: "1 iRBTC" },

    // Base tokens (WRBTC, DoC)
    { name: "WRBTC→DoC", src: wrbtc, dst: doc, amount: parseUnits("0.0001", 18), label: "0.0001 WRBTC" },
    { name: "DoC→WRBTC", src: doc, dst: wrbtc, amount: parseUnits("1", 18), label: "1 DoC" },

    // Cross: loan → base
    { name: "iDOC→WRBTC", src: iDOC, dst: wrbtc, amount: parseUnits("1", 18), label: "1 iDOC" },
    { name: "iRBTC→DoC", src: iRBTC, dst: doc, amount: parseUnits("1", 18), label: "1 iRBTC" },

    // Cross: base → loan
    { name: "WRBTC→iDOC", src: wrbtc, dst: iDOC, amount: parseUnits("0.0001", 18), label: "0.0001 WRBTC" },
    { name: "DoC→iRBTC", src: doc, dst: iRBTC, amount: parseUnits("1", 18), label: "1 DoC" },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const pair of pairs) {
    try {
      const result = await pub.readContract({
        address: protocol,
        abi: protocolAbi,
        functionName: "queryReturn",
        args: [pair.src, pair.dst, pair.amount],
      });
      console.log(`✅ ${pair.name.padEnd(15)} | ${pair.label} → ${formatUnits(result, 18).slice(0, 15).padEnd(15)} units`);
      successCount++;
    } catch (e: any) {
      const msg = (e.details ?? e.message ?? "unknown").toString().slice(0, 60);
      console.log(`❌ ${pair.name.padEnd(15)} | ${msg}`);
      failCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`✅ Working: ${successCount}/${pairs.length}`);
  console.log(`❌ Broken:  ${failCount}/${pairs.length}`);

  if (successCount > 0) {
    console.log(
      `\n🎯 RECOMENDACIÓN: Los pares que funcionan pueden usarse para margin trade sin "price disagreement".`,
    );
  }
}

main().catch(console.error);
