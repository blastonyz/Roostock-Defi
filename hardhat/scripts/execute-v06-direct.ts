import { ethers } from "ethers";
import * as dotenv from "dotenv";
import AccountArtifact from "../artifacts/contracts/AccountV06.sol/AccountV06.json";
import AccountFactoryArtifact from "../artifacts/contracts/AccountFactoryV06.sol/AccountFactoryV06.json";

dotenv.config({ override: true });

const ENTRYPOINT_ABI = [
  "function getNonce(address sender, uint192 key) external view returns (uint256 nonce)",
  "function getUserOpHash(tuple(address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature) userOp) external view returns (bytes32)",
  "function handleOps(tuple(address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)[] ops, address payable beneficiary) external"
] as const;

type UserOp = {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
};

async function main() {
  const rpcUrl = process.env.RSK_TESTNET_RPC_URL || "http://localhost:8545";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.RSK_PRIVATE_KEY || "", provider);

  const entryPointAddress = process.env.ENTRY_POINT_ADDRESS || "";
  const factoryAddress = process.env.EXISTING_FACTORY_ADDRESS || "";
  if (!entryPointAddress || !factoryAddress) throw new Error("ENTRY_POINT_ADDRESS/EXISTING_FACTORY_ADDRESS faltantes");

  const entryPoint = new ethers.Contract(entryPointAddress, ENTRYPOINT_ABI, wallet);
  const factory = new ethers.Contract(factoryAddress, AccountFactoryArtifact.abi, wallet);

  const sender = await factory["getAddress(address)"](wallet.address);
  const senderCode = await provider.getCode(sender);
  const accountExists = senderCode !== "0x";

  const factoryIface = new ethers.Interface(AccountFactoryArtifact.abi);
  let initCode = factoryAddress + factoryIface.encodeFunctionData("createAccount", [wallet.address]).slice(2);
  if (accountExists) initCode = "0x";

  const currentBalance = await provider.getBalance(sender);
  const targetBalance = ethers.parseEther("0.0002");
  if (currentBalance < targetBalance) {
    const topup = targetBalance - currentBalance;
    console.log("Prefunding sender with", ethers.formatEther(topup), "tRBTC");
    const topupTx = await wallet.sendTransaction({ to: sender, value: topup });
    await topupTx.wait();
  }

  const account = new ethers.Contract(sender, AccountArtifact.abi, provider);
  const gasPrice = await provider.getFeeData();
  const maxFeePerGas = gasPrice.gasPrice ?? ethers.parseUnits("30", "gwei");

  const opForHash: UserOp = {
    sender,
    nonce: "0x" + (await entryPoint.getNonce(sender, 0)).toString(16),
    initCode,
    callData: account.interface.encodeFunctionData("execute", [wallet.address, 0n, "0x"]),
    callGasLimit: "0x186a0",
    verificationGasLimit: "0xf4240",
    preVerificationGas: "0x1d4c0",
    maxFeePerGas: "0x" + maxFeePerGas.toString(16),
    maxPriorityFeePerGas: "0x" + maxFeePerGas.toString(16),
    paymasterAndData: "0x",
    signature: "0x",
  };

  const userOpHash = await entryPoint.getUserOpHash(opForHash);
  const signature = await wallet.signMessage(ethers.getBytes(userOpHash));
  const userOp: UserOp = { ...opForHash, signature };

  console.log("Sender:", sender);
  console.log("Account exists:", accountExists);
  console.log("UserOpHash:", userOpHash);

  try {
    await entryPoint.handleOps.staticCall([userOp], wallet.address);
    console.log("staticCall handleOps: ok");
  } catch (error) {
    console.log("staticCall handleOps error:", error);
  }

  try {
    const estimated = await entryPoint.handleOps.estimateGas([userOp], wallet.address);
    console.log("handleOps gas estimate:", estimated.toString());
  } catch (error) {
    console.log("handleOps estimateGas error:", error);
  }

  const tx = await entryPoint.handleOps([userOp], wallet.address, {
    gasLimit: 2_500_000,
    maxFeePerGas,
    maxPriorityFeePerGas: maxFeePerGas,
  });

  console.log("handleOps tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("receipt status:", receipt?.status);
  console.log("receipt block:", receipt?.blockNumber);

  const codeAfter = await provider.getCode(sender);
  console.log("sender deployed:", codeAfter !== "0x");
  const nonceAfter = await entryPoint.getNonce(sender, 0);
  console.log("nonce after:", nonceAfter.toString());
}

main().catch((error) => {
  console.error("Direct handleOps failed:", error);
  process.exitCode = 1;
});
