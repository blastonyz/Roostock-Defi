import "dotenv/config";

import { network } from "hardhat";
import { getAddress, isAddress } from "viem";

function requireAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !isAddress(value, { strict: false })) {
    throw new Error(`Falta ${label} en .env o no es una address válida`);
  }
  return getAddress(value.toLowerCase()) as `0x${string}`;
}

async function main() {
  const { viem } = await network.connect();
  const walletClients = await viem.getWalletClients();
  const deployer = walletClients[0];

  if (!deployer) {
    throw new Error("No hay wallet para deploy. Configura RSK_PRIVATE_KEY en .env");
  }

  const iDOC = requireAddress(process.env.SOVRYN_IDOC_ADDRESS, "SOVRYN_IDOC_ADDRESS");
  const iRBTC = requireAddress(process.env.SOVRYN_IRBTC_ADDRESS, "SOVRYN_IRBTC_ADDRESS");
  const sovrynProtocol = requireAddress(
    process.env.SOVRYN_PROTOCOL_ADDRESS,
    "SOVRYN_PROTOCOL_ADDRESS",
  );
  const doc = requireAddress(process.env.SOVRYN_DOC_ADDRESS, "SOVRYN_DOC_ADDRESS");
  const wrbtc = requireAddress(process.env.SOVRYN_WRBTC_ADDRESS, "SOVRYN_WRBTC_ADDRESS");

  console.log("Deployer:", deployer.account.address);
  console.log("Deploying SovrynMarginTrader with:");
  console.log("  iDOC:", iDOC);
  console.log("  iRBTC:", iRBTC);
  console.log("  SovrynProtocol:", sovrynProtocol);
  console.log("  DoC:", doc);
  console.log("  WRBTC:", wrbtc);

  const contract = await viem.deployContract("SovrynMarginTrader", [
    iDOC,
    iRBTC,
    sovrynProtocol,
    doc,
    wrbtc,
  ]);

  console.log("SovrynMarginTrader deployed at:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
