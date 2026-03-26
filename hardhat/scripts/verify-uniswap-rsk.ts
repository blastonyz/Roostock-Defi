/**
 * verify-uniswap-rsk.ts
 * Check Uniswap availability on RSK testnet
 */
import "dotenv/config";
import { network } from "hardhat";
import { getAddress } from "viem";

const factoryAbi = [
  {
    type: "function",
    name: "getPair",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "allPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

const pairAbi = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint112" }, { type: "uint112" }, { type: "uint32" }],
  },
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

async function main() {
  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  console.log("=== Uniswap on RSK Testnet ===\n");

  // Common Uniswap addresses across networks
  const candidates = {
    "UniswapV2Router02": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "UniswapV2Factory": "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    "UniswapV3Router": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    "UniswapV3Factory": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "WETH9": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  };

  console.log("Checking standard Uniswap addresses...\n");

  for (const [name, addr] of Object.entries(candidates)) {
    try {
      const code = await pub.getBytecode({ address: getAddress(addr) as `0x${string}` });
      const hasCode = code && code !== "0x";
      console.log(`${name.padEnd(20)} ${addr}: ${hasCode ? "✅ EXISTS" : "❌ EMPTY"}`);
    } catch (e) {
      console.log(`${name.padEnd(20)} ${addr}: ⚠️ ERROR`);
    }
  }

  // Check WRBTC/DoC pair
  const FACTORY = getAddress("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
  const WRBTC = getAddress("0x69fE5cEc81D5eF92600c1a0dB1F11986AB3758ab");
  const DOC = getAddress("0xCB46C0DdC60d18eFEB0E586C17Af6ea36452DaE0");

  console.log("\n=== Checking WRBTC/DoC pair ===\n");

  try {
    const totalPairs = await pub.readContract({
      address: FACTORY,
      abi: factoryAbi,
      functionName: "allPairsLength",
    });
    console.log("Total pairs in factory:", totalPairs.toString());

    const pairAddr = await pub.readContract({
      address: FACTORY,
      abi: factoryAbi,
      functionName: "getPair",
      args: [WRBTC, DOC],
    });
    console.log("WRBTC/DoC pair address:", pairAddr);

    const zeroAddr = "0x0000000000000000000000000000000000000000";
    if (pairAddr.toLowerCase() === zeroAddr) {
      console.log("❌ Par no existe en este factory!");
    } else {
      const [r0, r1] = await pub.readContract({
        address: pairAddr as `0x${string}`,
        abi: pairAbi,
        functionName: "getReserves",
      });
      const t0 = await pub.readContract({ address: pairAddr as `0x${string}`, abi: pairAbi, functionName: "token0" });
      console.log(`token0: ${t0}`);
      console.log(`Reserves: ${r0.toString()} / ${r1.toString()}`);
      if (r0 === 0n && r1 === 0n) {
        console.log("⚠️  Par existe pero sin liquidez");
      } else {
        console.log("✅ Par con liquidez!");
      }
    }
  } catch (e) {
    console.log("❌ Error al leer factory:", (e as Error).message?.slice(0, 200));
  }
}

main().catch(console.error);
