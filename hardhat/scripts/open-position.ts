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
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const traderAbi = [
  {
    type: "function",
    name: "openMarginTradeWRBTC",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "loanAmount" },
      { type: "uint256", name: "collateralAmount" },
      { type: "uint256", name: "leverageAmount" },
      { type: "address", name: "tradeTokenAddress" },
    ],
    outputs: [{ type: "bytes32", name: "loanId" }],
  },
] as const;

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const deployer = walletClients[0];

  if (!deployer) {
    throw new Error("No hay wallet para operar. Configura RSK_PRIVATE_KEY en .env");
  }

  const doc = requireAddress(process.env.SOVRYN_DOC_ADDRESS, "SOVRYN_DOC_ADDRESS");
  const wrbtc = requireAddress(process.env.SOVRYN_WRBTC_ADDRESS, "SOVRYN_WRBTC_ADDRESS");
  const trader = requireAddress(
    process.env.SOVRYN_MARGIN_TRADER_ADDRESS,
    "SOVRYN_MARGIN_TRADER_ADDRESS",
  );

  const loanAmountInput = readEnvNumber("SOVRYN_LOAN_AMOUNT_WRBTC", "0.00001");
  const collateralAmountInput = readEnvNumber("SOVRYN_COLLATERAL_AMOUNT_DOC", "0.1");
  // SOVRYN_LEVERAGE: full leverage multiplier in 1e18 units (e.g. "2" = 2x, "3" = 3x)
  const leverageAmount = parseUnits(process.env.SOVRYN_LEVERAGE ?? "2", 18);

  const [docDecimals, docSymbol] = await Promise.all([
    publicClient.readContract({ address: doc, abi: erc20Abi, functionName: "decimals" }),
    publicClient.readContract({ address: doc, abi: erc20Abi, functionName: "symbol" }),
  ]);

  const loanAmount = parseUnits(loanAmountInput, 18);
  const collateralAmount = parseUnits(collateralAmountInput, docDecimals);

  const [docBalance, currentAllowance] = await Promise.all([
    publicClient.readContract({
      address: doc,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [deployer.account.address],
    }),
    publicClient.readContract({
      address: doc,
      abi: erc20Abi,
      functionName: "allowance",
      args: [deployer.account.address, trader],
    }),
  ]);

  console.log("Operador:", deployer.account.address);
  console.log("SovrynMarginTrader:", trader);
  console.log(
    `Parámetros: loan WRBTC=${loanAmountInput}, collateral ${docSymbol}=${collateralAmountInput}, leverageMinusOne=${leverageAmount}`,
  );
  console.log(
    `Balance ${docSymbol}: ${formatUnits(docBalance, docDecimals)} (${docBalance.toString()} raw)`,
  );

  if (docBalance < collateralAmount) {
    throw new Error(
      `Balance insuficiente de ${docSymbol}. Necesitas ${collateralAmountInput} y tienes ${formatUnits(docBalance, docDecimals)}`,
    );
  }

  if (currentAllowance < collateralAmount) {
    console.log("Allowance insuficiente. Aprobando DoC para SovrynMarginTrader...");
    const approveHash = await deployer.writeContract({
      address: doc,
      abi: erc20Abi,
      functionName: "approve",
      args: [trader, collateralAmount],
      account: deployer.account,
      chain: deployer.chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("Approve tx:", approveHash);
  } else {
    console.log("Allowance OK.");
  }

  const tradeTx = await deployer.writeContract({
    address: trader,
    abi: traderAbi,
    functionName: "openMarginTradeWRBTC",
    args: [loanAmount, collateralAmount, leverageAmount, wrbtc],
    account: deployer.account,
    chain: deployer.chain,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: tradeTx });

  console.log("Margin trade enviada ✅");
  console.log("tx:", tradeTx);
  console.log("status:", receipt.status);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
