/**
 * diagnose-prices.ts
 * Query oracle price vs AMM/pool actual rate for WRBTC/DoC.
 * Used to understand "price disagreement" revert cause.
 */
import "dotenv/config";
import { network } from "hardhat";
import { formatUnits, getAddress, isAddress } from "viem";

function requireAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !isAddress(value, { strict: false })) throw new Error(`Falta ${label}`);
  return getAddress(value.toLowerCase()) as `0x${string}`;
}

const protocolAbi = [
  {
    type: "function",
    name: "priceFeeds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "queryReturn",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "sourceToken" },
      { type: "address", name: "destToken" },
      { type: "uint256", name: "sourceAmount" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

const priceFeedsAbi = [
  {
    type: "function",
    name: "queryRate",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "sourceToken" },
      { type: "address", name: "destToken" },
    ],
    outputs: [{ type: "uint256", name: "rate" }, { type: "uint256", name: "precision" }],
  },
  {
    type: "function",
    name: "checkPriceDisagreement",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "sourceToken" },
      { type: "address", name: "destToken" },
      { type: "uint256", name: "sourceAmount" },
      { type: "uint256", name: "destAmount" },
      { type: "uint256", name: "maxDisagreement" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const iDOCAbi = [
  {
    type: "function",
    name: "getEstimatedMarginDetails",
    stateMutability: "view",
    inputs: [
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "address" },
    ],
    outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalAssetSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalAssetBorrow",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  const wrbtcAddr = requireAddress(process.env.SOVRYN_WRBTC_ADDRESS, "SOVRYN_WRBTC_ADDRESS");
  const docAddr = requireAddress(process.env.SOVRYN_DOC_ADDRESS, "SOVRYN_DOC_ADDRESS");
  const protocolAddr = requireAddress(process.env.SOVRYN_PROTOCOL_ADDRESS, "SOVRYN_PROTOCOL_ADDRESS");
  const iDOCAddr = requireAddress(process.env.SOVRYN_IDOC_ADDRESS, "SOVRYN_IDOC_ADDRESS");

  // 1. Pool state
  console.log("=== Pool State (iDOC) ===");
  const [supply, borrow, iDOCPrice] = await Promise.all([
    publicClient.readContract({ address: iDOCAddr, abi: iDOCAbi, functionName: "totalAssetSupply" }),
    publicClient.readContract({ address: iDOCAddr, abi: iDOCAbi, functionName: "totalAssetBorrow" }),
    publicClient.readContract({ address: iDOCAddr, abi: iDOCAbi, functionName: "tokenPrice" }).catch(() => 0n),
  ]);
  console.log("iDOC totalAssetSupply:", formatUnits(supply, 18), "DoC");
  console.log("iDOC totalAssetBorrow:", formatUnits(borrow, 18), "DoC");
  console.log("iDOC tokenPrice:      ", formatUnits(iDOCPrice, 18));
  const utilizationRate = supply > 0n ? Number((borrow * 10000n) / supply) / 100 : 0;
  console.log("iDOC utilization:     ", utilizationRate.toFixed(2) + "%");

  // 2. Oracle rate via protocol.queryReturn
  console.log("\n=== Oracle Price (SovrynProtocol.queryReturn) ===");
  const amountDoC = 6n * 10n ** 18n; // 6 DoC
  const amountWRBTC = 4n * 10n ** 14n; // 0.0004 WRBTC

  const [wrbtcFromDoc, docFromWrbtc] = await Promise.all([
    publicClient.readContract({
      address: protocolAddr,
      abi: protocolAbi,
      functionName: "queryReturn",
      args: [docAddr, wrbtcAddr, amountDoC],
    }).catch(() => 0n),
    publicClient.readContract({
      address: protocolAddr,
      abi: protocolAbi,
      functionName: "queryReturn",
      args: [wrbtcAddr, docAddr, amountWRBTC],
    }).catch(() => 0n),
  ]);

  const docPerWrbtc = docFromWrbtc > 0n ? Number(docFromWrbtc) / 1e18 : 0;
  const wrbtcPerDoc = wrbtcFromDoc > 0n ? Number(wrbtcFromDoc) / 1e18 : 0;
  console.log(`queryReturn(DoC→WRBTC): 6 DoC → ${(wrbtcPerDoc).toFixed(8)} WRBTC`);
  console.log(`  → implies 1 WRBTC = ${wrbtcPerDoc > 0 ? (6 / wrbtcPerDoc).toFixed(2) : "?"} DoC`);
  console.log(`queryReturn(WRBTC→DoC): 0.0004 WRBTC → ${(docPerWrbtc).toFixed(4)} DoC`);
  console.log(`  → implies 1 WRBTC = ${(docPerWrbtc / 0.0004).toFixed(2)} DoC`);

  // 3. getEstimatedMarginDetails (uses AMM price for swap estimate)
  console.log("\n=== Margin Estimate (iDOC.getEstimatedMarginDetails) ===");
  const leverage2x = 2n * 10n ** 18n;
  const [marginPrincipal, marginInterestRate, marginEntryPrice] = await publicClient.readContract({
    address: iDOCAddr,
    abi: iDOCAbi,
    functionName: "getEstimatedMarginDetails",
    args: [leverage2x, 0n, amountWRBTC, wrbtcAddr],
  });
  console.log("principal (DoC loan):  ", formatUnits(marginPrincipal, 18));
  console.log("interestRate:          ", formatUnits(marginInterestRate, 18));
  console.log("entryPrice (WRBTC/DoC):", formatUnits(marginEntryPrice, 18));
  const impliedWrbtcRate = marginPrincipal > 0n
    ? Number(marginPrincipal) / Number(marginEntryPrice)
    : 0;
  console.log(`  → if entryPrice is DoC/WRBTC: 1 WRBTC = ${Number(formatUnits(marginEntryPrice, 18)).toFixed(4)} DoC`);

  // 4. Price disagreement analysis
  console.log("\n=== Price Disagreement Analysis ===");
  const oracleWRBTC = wrbtcFromDoc;                       // oracle: 6 DoC → X WRBTC
  const ammWRBTC = marginEntryPrice;                       // AMM entry price (3rd return value from getEstimated)

  if (oracleWRBTC > 0n && ammWRBTC > 0n) {
    const oracle = Number(oracleWRBTC) / 1e18;
    const amm = Number(ammWRBTC) / 1e18;
    const deviationPct = Math.abs(oracle - amm) / Math.max(oracle, amm) * 100;
    console.log(`Oracle DoC→WRBTC for 6 DoC:  ${oracle.toFixed(8)} WRBTC`);
    console.log(`AMM entry price (3rd output): ${amm.toFixed(8)}`);
    console.log(`Deviation: ${deviationPct.toFixed(2)}%`);
    if (deviationPct > 5) {
      console.log(`❌ Deviation ${deviationPct.toFixed(1)}% > 5% — margin trade will revert "price disagreement"`);
      console.log(`   Oracle BTC price: ~$${(6 / oracle).toFixed(0)} (${1 / oracle < 1 ? "stale?" : ""})`);
    } else {
      console.log(`✅ Deviation ${deviationPct.toFixed(1)}% OK — within tolerance`);
    }
  } else {
    console.log("Cannot compute deviation (one or both values are 0)");
  }

  // 5. Try checkPriceDisagreement at different thresholds
  console.log("\n=== Testing maxDisagreement thresholds ===");
  const priceFeedsAddr = await publicClient.readContract({
    address: protocolAddr,
    abi: protocolAbi,
    functionName: "priceFeeds",
  }).catch(() => null as unknown as `0x${string}`);

  if (priceFeedsAddr) {
    console.log("PriceFeeds contract:", priceFeedsAddr);
    for (const threshold of [300n, 500n, 1000n, 2000n, 5000n]) {
      const result = await publicClient.readContract({
        address: priceFeedsAddr,
        abi: priceFeedsAbi,
        functionName: "checkPriceDisagreement",
        args: [docAddr, wrbtcAddr, amountDoC, oracleWRBTC, threshold],
      }).catch(() => false);
      console.log(`  maxDisagreement=${threshold} bps (${Number(threshold) / 100}%): ${result ? "✅ PASS" : "❌ FAIL"}`);
    }
  }
}

main().catch(console.error);
