import "dotenv/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

function normalizePrivateKey(privateKey?: string): `0x${string}` | undefined {
  if (!privateKey) return undefined;
  return (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`;
}

const sepoliaPrivateKey = normalizePrivateKey(process.env.SEPOLIA_PRIVATE_KEY);
const rskPrivateKey = normalizePrivateKey(process.env.RSK_PRIVATE_KEY);

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org",
      accounts: sepoliaPrivateKey ? [sepoliaPrivateKey] : [],
    },
    rskMainnet: {
      type: "http",
      chainType: "l1",
      url: process.env.RSK_MAINNET_RPC_URL ?? "https://public-node.rsk.co",
      accounts: rskPrivateKey ? [rskPrivateKey] : [],
    },
    rskTestnet: {
      type: "http",
      chainType: "l1",
      url: process.env.RSK_TESTNET_RPC_URL ?? "https://public-node.testnet.rsk.co",
      accounts: rskPrivateKey ? [rskPrivateKey] : [],
    },
  },
});
