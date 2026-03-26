import "dotenv/config";
import { network } from "hardhat";
import { getAddress, isAddress } from "viem";

function req(name: string) {
  const v = process.env[name];
  if (!v || !isAddress(v)) throw new Error(`${name} inválido`);
  return getAddress(v);
}

async function main() {
  const ENTRY = req("ENTRY_POINT_ADDRESS");
  const FACTORY = req("AA_FACTORY_ADDRESS");
  const PAYMASTER = req("AA_PAYMASTER_ADDRESS");
  const EOA = getAddress("0x0571235134dC15a00f02916987c2C16B5fc52e2A");

  const { viem } = await network.connect();
  const pub = await viem.getPublicClient();

  const factoryEp = await pub.readContract({
    address: FACTORY,
    abi: [{ type: "function", name: "entryPoint", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
    functionName: "entryPoint",
  });

  const paymasterEp = await pub.readContract({
    address: PAYMASTER,
    abi: [{ type: "function", name: "entryPoint", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
    functionName: "entryPoint",
  });

  const smartAccount = await pub.readContract({
    address: FACTORY,
    abi: [{ type: "function", name: "getAddress", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] }] as const,
    functionName: "getAddress",
    args: [EOA],
  });

  const accountCode = await pub.getBytecode({ address: smartAccount });
  const accountExists = !!accountCode && accountCode !== "0x";

  let accountEp: `0x${string}` | "not-deployed" = "not-deployed";
  if (accountExists) {
    accountEp = await pub.readContract({
      address: smartAccount,
      abi: [{ type: "function", name: "entryPoint", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
      functionName: "entryPoint",
    });
  }

  console.log("ENTRY_POINT_ADDRESS(env):", ENTRY);
  console.log("Factory.entryPoint():   ", factoryEp);
  console.log("Paymaster.entryPoint(): ", paymasterEp);
  console.log("Smart account:          ", smartAccount, accountExists ? "(deployed)" : "(not deployed)");
  console.log("Account.entryPoint():   ", accountEp);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
