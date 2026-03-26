import "dotenv/config";

import { network } from "hardhat";
import { formatUnits, getAddress, isAddress, parseUnits } from "viem";

function requireAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`Falta ${label} en .env o no es una address válida`);
  }
  return getAddress(value.toLowerCase()) as `0x${string}`;
}

// WRBTC is a wrapped RBTC (WETH-style): deposit() payable, withdraw(uint256)
const wrbtcAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256" }],
    outputs: [],
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
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const traderAbi = [
  {
    type: "function",
    name: "openMarginTradeDoC",
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
] as const;

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const wallet = walletClients[0];

  if (!wallet) throw new Error("No hay wallet. Configura RSK_PRIVATE_KEY en .env");

  const wrbtcAddr = requireAddress(process.env.SOVRYN_WRBTC_ADDRESS, "SOVRYN_WRBTC_ADDRESS");
  const docAddr = requireAddress(process.env.SOVRYN_DOC_ADDRESS, "SOVRYN_DOC_ADDRESS");
  const traderAddr = requireAddress(
    process.env.SOVRYN_MARGIN_TRADER_ADDRESS,
    "SOVRYN_MARGIN_TRADER_ADDRESS",
  );
  const iDOCAddr = requireAddress(process.env.SOVRYN_IDOC_ADDRESS, "SOVRYN_IDOC_ADDRESS");

  // Config:
  // WRAP_AMOUNT_RBTC: tRBTC to wrap into WRBTC (collateral)
  // SOVRYN_LEVERAGE: full multiplier in 1e18 units ("2" = 2x, "3" = 3x)
  // loanAmountDoC = 0: don't provide DoC ourselves, let the pool lever up via collateral
  const wrapAmountRBTC = parseUnits(process.env.WRAP_AMOUNT_RBTC ?? "0", 18);
  const loanAmountDoC = 0n;
  const leverageAmount = parseUnits(process.env.SOVRYN_LEVERAGE ?? "2", 18);

  const tRBTCBalance = await publicClient.getBalance({ address: wallet.account.address });

  console.log("Wallet:", wallet.account.address);
  console.log("tRBTC balance:", formatUnits(tRBTCBalance, 18));
  console.log("Wrap amount:", formatUnits(wrapAmountRBTC, 18), "RBTC → WRBTC (0 = usar WRBTC ya disponible)");
  console.log("Loan DoC: 0 (pool aporta el DoC via leverage)");
  console.log("Leverage:", formatUnits(leverageAmount, 18) + "x");

  if (wrapAmountRBTC > 0n && tRBTCBalance < wrapAmountRBTC + parseUnits("0.00005", 18)) {
    throw new Error(
      `tRBTC insuficiente. Balance: ${formatUnits(tRBTCBalance, 18)}, necesitás al menos ${formatUnits(wrapAmountRBTC, 18)} + gas.`,
    );
  }

  // Step 1: wrap tRBTC → WRBTC via deposit() (opcional, se salta si wrapAmountRBTC=0)
  const wrbtcBefore = await publicClient.readContract({
    address: wrbtcAddr,
    abi: wrbtcAbi,
    functionName: "balanceOf",
    args: [wallet.account.address],
  });

  let wrbtcAfterWrap: bigint;
  if (wrapAmountRBTC > 0n) {
    console.log("\n[1/4] Wrapping", formatUnits(wrapAmountRBTC, 18), "tRBTC → WRBTC...");
    const wrapTx = await wallet.writeContract({
      address: wrbtcAddr,
      abi: wrbtcAbi,
      functionName: "deposit",
      value: wrapAmountRBTC,
      account: wallet.account,
      chain: wallet.chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: wrapTx });
    console.log("wrap tx:", wrapTx);
    wrbtcAfterWrap = await publicClient.readContract({
      address: wrbtcAddr,
      abi: wrbtcAbi,
      functionName: "balanceOf",
      args: [wallet.account.address],
    });
    console.log("WRBTC balance: antes", formatUnits(wrbtcBefore, 18), "→ ahora", formatUnits(wrbtcAfterWrap, 18));
  } else {
    console.log("\n[1/4] Sin wrap (WRAP_AMOUNT_RBTC=0), usando WRBTC disponible:", formatUnits(wrbtcBefore, 18));
    wrbtcAfterWrap = await publicClient.readContract({
      address: wrbtcAddr,
      abi: wrbtcAbi,
      functionName: "balanceOf",
      args: [wallet.account.address],
    });
  }

  // Step 2: get estimated position size (informativo)
  // Args: leverage, loanDoC=0 (pool aporta todo), collateral=nuestro WRBTC
  const collateralNeeded = wrbtcAfterWrap;
  console.log("\n[2/4] Consultando getEstimatedMarginDetails en iDOC...");
  try {
    const [posibleSize, minReturnEst] = await publicClient.readContract({
      address: iDOCAddr,
      abi: iDOCAbi,
      functionName: "getEstimatedMarginDetails",
      args: [leverageAmount, loanAmountDoC, wrbtcAfterWrap, wrbtcAddr],
    });
    console.log("Posición estimada:", formatUnits(posibleSize, 18), "DoC");
    console.log("minReturn estimado:", formatUnits(minReturnEst, 18));
  } catch {
    console.log("getEstimatedMarginDetails no respondió, continuando con collateral =", formatUnits(collateralNeeded, 18), "WRBTC");
  }

  // Step 3: approve WRBTC → SovrynMarginTrader
  console.log("\n[3/4] Aprobando", formatUnits(collateralNeeded, 18), "WRBTC para SovrynMarginTrader...");
  const approveTx = await wallet.writeContract({
    address: wrbtcAddr,
    abi: wrbtcAbi,
    functionName: "approve",
    args: [traderAddr, collateralNeeded],
    account: wallet.account,
    chain: wallet.chain,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log("approve tx:", approveTx);

  // Step 4: open margin trade DoC (borrow DoC, collateral WRBTC)
  // El contrato maneja try-catch: si falla con docAddr, retintenta con iDOC
  console.log("\n[4/4] Abriendo posición margin: borrow", formatUnits(loanAmountDoC, 18), "DoC, colateral", formatUnits(collateralNeeded, 18), "WRBTC...");
  const tradeTx = await wallet.writeContract({
    address: traderAddr,
    abi: traderAbi,
    functionName: "openMarginTradeDoC",
    args: [loanAmountDoC, collateralNeeded, leverageAmount, docAddr],
    account: wallet.account,
    chain: wallet.chain,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: tradeTx });
  console.log("trade tx:", tradeTx);
  console.log("status:", receipt.status);

  if (receipt.status !== "success") {
    throw new Error("La transacción de margin trade falló. Revisá el tx en el explorer.");
  }

  console.log("\nPosición abierta ✅");
  console.log(
    "Explorer: https://explorer.testnet.rsk.co/tx/" + tradeTx,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
