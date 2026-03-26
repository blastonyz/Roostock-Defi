import "dotenv/config";

import { network } from "hardhat";
import { isAddress, parseEther } from "viem";

const DEFAULT_ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const;
const DEFAULT_CREATE_ACCOUNT_GAS = 1_500_000n;

function parseOptionalBigInt(value?: string): bigint | undefined {
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error("CREATE_ACCOUNT_GAS_LIMIT debe ser un entero positivo en .env");
  }
  return BigInt(value);
}

async function fetchBundlerEntryPoints(bundlerRpcUrl: string): Promise<`0x${string}`[]> {
  const response = await fetch(bundlerRpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_supportedEntryPoints",
      params: [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Bundler respondió HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: string[];
    error?: { message?: string };
  };

  if (data.error) {
    throw new Error(data.error.message ?? "Error RPC en eth_supportedEntryPoints");
  }

  return (data.result ?? []).filter((value): value is `0x${string}` => isAddress(value));
}

const configuredEntryPoint = (process.env.ENTRY_POINT_ADDRESS ?? DEFAULT_ENTRY_POINT) as `0x${string}`;
if (!isAddress(configuredEntryPoint)) {
  throw new Error("ENTRY_POINT_ADDRESS inválida en .env");
}

const envCreateAccountGas = parseOptionalBigInt(process.env.CREATE_ACCOUNT_GAS_LIMIT);
const requireEntryPoint = process.env.REQUIRE_ENTRYPOINT === "true";
const bundlerRpcUrl = process.env.BUNDLER_RPC_URL?.trim();
const autoSelectBundlerEntryPoint = process.env.AUTO_SELECT_BUNDLER_ENTRYPOINT === "true";

let entryPoint = configuredEntryPoint;

if (bundlerRpcUrl) {
  try {
    const supportedEntryPoints = await fetchBundlerEntryPoints(bundlerRpcUrl);
    if (supportedEntryPoints.length > 0) {
      console.log("Bundler soporta EntryPoints:", supportedEntryPoints.join(", "));
      const isConfiguredSupported = supportedEntryPoints.some(
        (address) => address.toLowerCase() === configuredEntryPoint.toLowerCase(),
      );

      if (!isConfiguredSupported) {
        const msg =
          `ENTRY_POINT_ADDRESS (${configuredEntryPoint}) no está en eth_supportedEntryPoints del bundler.`;
        if (autoSelectBundlerEntryPoint) {
          entryPoint = supportedEntryPoints[0];
          console.log(`⚠️ ${msg} Usando ${entryPoint} por AUTO_SELECT_BUNDLER_ENTRYPOINT=true.`);
        } else {
          console.log(`⚠️ ${msg}`);
          console.log("Tip: activa AUTO_SELECT_BUNDLER_ENTRYPOINT=true o corrige ENTRY_POINT_ADDRESS.");
        }
      }
    } else {
      console.log("⚠️ El bundler no devolvió EntryPoints soportados.");
    }
  } catch (error) {
    console.log("⚠️ No se pudo consultar eth_supportedEntryPoints del bundler:", error);
  }
}

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const walletClients = await viem.getWalletClients();
const deployer = walletClients[0];

if (!deployer) {
  throw new Error(
    "No hay cuenta configurada para firmar. Configura RSK_PRIVATE_KEY en .env (sin 0x) y vuelve a ejecutar el script.",
  );
}

console.log("Network listo. Deployer:", deployer.account.address);
console.log("EntryPoint:", entryPoint);

// Chequeo de balance del deployer antes de gastar gas
const deployerBalance = await publicClient.getBalance({ address: deployer.account.address });
console.log("Balance deployer:", deployerBalance.toString(), "wei");
if (deployerBalance === 0n) {
  throw new Error(
    `Deployer ${deployer.account.address} no tiene saldo.\n` +
    `Conseguí tRBTC en el faucet: https://faucet.rootstock.io/`,
  );
}

const entryPointCode = await publicClient.getBytecode({ address: entryPoint });
const hasEntryPoint = !!entryPointCode && entryPointCode !== "0x";
if (!hasEntryPoint) {
  const msg =
    "EntryPoint no encontrado en esta red para ENTRY_POINT_ADDRESS. Verifica la dirección o usa otra en .env.";
  if (requireEntryPoint) {
    throw new Error(msg);
  }
  console.log(`⚠️ ${msg}`);
}

const factory = await viem.deployContract("AccountFactory", [entryPoint]);
console.log("AccountFactory desplegado en:", factory.address);

const paymaster = await viem.deployContract("Paymaster", [entryPoint]);
console.log("Paymaster desplegado en:", paymaster.address);

const smartAccountAddress = await factory.read.getAddress([deployer.account.address]);
console.log("Smart account esperada (counterfactual):", smartAccountAddress);

const latestBlock = await publicClient.getBlock({ blockTag: "latest" });
const blockGasLimit = latestBlock.gasLimit;
const cappedDefaultCreateGas =
  blockGasLimit > 100_000n
    ? (DEFAULT_CREATE_ACCOUNT_GAS < blockGasLimit - 100_000n
        ? DEFAULT_CREATE_ACCOUNT_GAS
        : blockGasLimit - 100_000n)
    : blockGasLimit;
const createAccountGasLimit = envCreateAccountGas ?? cappedDefaultCreateGas;

console.log("Gas límite bloque:", blockGasLimit.toString());
console.log("Gas createAccount usado:", createAccountGasLimit.toString());

const createHash = await factory.write.createAccount([deployer.account.address], {
  gas: createAccountGasLimit,
});
await publicClient.waitForTransactionReceipt({ hash: createHash });
console.log("Smart account creada. tx:", createHash);

// ── Flujo SELF-PAY: fondeamos la smart account para que pague su propio gas ──
// Si preferís gasless/sponsored, esta parte no es necesaria: el Paymaster deposita en el
// EntryPoint y cubre el gas de los usuarios. Ver flujo SPONSORED más abajo.
const balanceAfterDeploys = await publicClient.getBalance({ address: deployer.account.address });
const fundAmount = parseEther("0.0001"); // mínimo razonable para testnet
const gasReserve = parseEther("0.0002"); // reserva para el resto de txs del script

if (balanceAfterDeploys > fundAmount + gasReserve) {
  const fundHash = await deployer.sendTransaction({
    to: smartAccountAddress,
    value: fundAmount,
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log("[SELF-PAY] Smart account fondeada con", fundAmount.toString(), "wei. tx:", fundHash);
} else {
  console.log(
    `[SELF-PAY] Balance insuficiente (${balanceAfterDeploys} wei) para fondear smart account.`,
    "\n  Conseguí tRBTC en: https://faucet.rootstock.io/",
    "\n  Saltando al flujo SPONSORED (Paymaster deposita en EntryPoint).",
  );
}

// ── Flujo SPONSORED: Paymaster deposita en el EntryPoint para cubrir gas de usuarios ──
if (hasEntryPoint) {
  const balanceForPaymaster = await publicClient.getBalance({ address: deployer.account.address });
  const paymasterDeposit = parseEther("0.0001");
  if (balanceForPaymaster > paymasterDeposit + gasReserve) {
    const depositHash = await paymaster.write.deposit({
      value: paymasterDeposit,
    });
    await publicClient.waitForTransactionReceipt({ hash: depositHash });
    console.log("[SPONSORED] Paymaster depositado en EntryPoint. tx:", depositHash);
  } else {
    console.log(
      `[SPONSORED] Balance insuficiente para depositar en Paymaster. Obtén más tRBTC: https://faucet.rootstock.io/`,
    );
  }
} else {
  console.log("[SPONSORED] EntryPoint sin código en esta red. Saltando depósito del Paymaster.");
}

const smartAccountBalance = await publicClient.getBalance({ address: smartAccountAddress });
console.log("Balance smart account:", smartAccountBalance.toString());

console.log("Flujo AA base completado ✅");
