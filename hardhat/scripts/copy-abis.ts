import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractsToCopy = ["SovrynSwapper", "SovrynMarginTrader"];
const artifactsRoot = path.resolve(__dirname, "../artifacts/contracts");
const frontendContractsRoot = path.resolve(__dirname, "../../frontend/lib/contracts");

for (const contractName of contractsToCopy) {
  const artifactPath = path.join(artifactsRoot, `${contractName}.sol`, `${contractName}.json`);
  const targetPath = path.join(frontendContractsRoot, `${contractName}.json`);

  if (!fs.existsSync(artifactPath)) {
    console.warn(`Skipping ${contractName}: artifact not found at ${artifactPath}`);
    continue;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(artifactPath, targetPath);
  console.log(`Copied ${contractName} artifact to ${targetPath}`);
}
