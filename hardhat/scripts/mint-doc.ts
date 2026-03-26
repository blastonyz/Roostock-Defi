import "dotenv/config";

import { network } from "hardhat";
import { formatUnits, getAddress, isAddress, parseUnits } from "viem";

function requireAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`Falta ${label} en .env o no es una address válida`);
  }
  return getAddress(value.toLowerCase()) as `0x${string}`;
}

function readEnvNumber(name: string, defaultValue: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`${name} debe ser numérico. Valor recibido: ${value}`);
  }
  return value;
}

const erc20Abi = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const docMintAbi = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "isOwner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "isMinter",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "addMinter",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const wallet = walletClients[0];

  if (!wallet) {
    throw new Error("No hay wallet para mintear. Configura RSK_PRIVATE_KEY en .env");
  }

  const tokenAddress = requireAddress(
    process.env.DOC_MINT_SOURCE_ADDRESS ?? process.env.SOVRYN_DOC_ADDRESS,
    "DOC_MINT_SOURCE_ADDRESS o SOVRYN_DOC_ADDRESS",
  );

  const amountInput = readEnvNumber("DOC_MINT_AMOUNT", "10");

  const code = await publicClient.getBytecode({ address: tokenAddress });
  if (!code || code === "0x") {
    throw new Error(
      `No hay bytecode en ${tokenAddress} para esta red. Si usas 0xE700..., corre en rskMainnet o usa el DoC testnet 0xCb46...`,
    );
  }

  const [symbol, decimals, beforeBalance] = await Promise.all([
    publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
    publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [wallet.account.address],
    }),
  ]);

  const amount = parseUnits(amountInput, decimals);
  console.log(`Wallet: ${wallet.account.address}`);
  console.log(`Token: ${tokenAddress} (${symbol})`);
  console.log(`Balance antes: ${formatUnits(beforeBalance, decimals)} ${symbol}`);
  console.log(`Intentando mintear: ${amountInput} ${symbol}`);

  const [owner, isOwner, isMinter] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: docMintAbi,
      functionName: "owner",
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: docMintAbi,
      functionName: "isOwner",
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: docMintAbi,
      functionName: "isMinter",
      args: [wallet.account.address],
    }),
  ]);

  console.log(`Owner: ${owner}`);
  console.log(`isOwner(wallet): ${isOwner}`);
  console.log(`isMinter(wallet): ${isMinter}`);

  if (!isMinter) {
    if (!isOwner) {
      throw new Error(
        `Tu wallet no es minter y tampoco owner. Pídele al owner (${owner}) que ejecute addMinter(${wallet.account.address}).`,
      );
    }

    console.log("La wallet es owner pero no minter. Ejecutando addMinter(wallet)...");
    const addMinterTx = await wallet.writeContract({
      address: tokenAddress,
      abi: docMintAbi,
      functionName: "addMinter",
      args: [wallet.account.address],
      account: wallet.account,
      chain: wallet.chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: addMinterTx });
    console.log(`addMinter tx: ${addMinterTx}`);
  }

  const mintTx = await wallet.writeContract({
    address: tokenAddress,
    abi: docMintAbi,
    functionName: "mint",
    args: [wallet.account.address, amount],
    account: wallet.account,
    chain: wallet.chain,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });
  console.log(`mint tx: ${mintTx}`);
  console.log(`mint status: ${receipt.status}`);

  const afterBalance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet.account.address],
  });

  console.log(`Balance después: ${formatUnits(afterBalance, decimals)} ${symbol}`);
  console.log(`Delta: ${formatUnits(afterBalance - beforeBalance, decimals)} ${symbol}`);

  if (afterBalance <= beforeBalance) {
    throw new Error("La tx no incrementó balance. Posible mint restringido o política adicional del token.");
  }

  console.log("Minteo completado ✅");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
