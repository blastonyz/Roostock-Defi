import { ethers } from "ethers";
import * as dotenv from "dotenv";
import AccountFactoryArtifact from "../artifacts/contracts/AccountFactoryV06.sol/AccountFactoryV06.json";
dotenv.config({ override: true });

// EntryPoint v0.6 ABI (minimal)
const ENTRYPOINT_ABI = [
    "function getSenderAddress(bytes calldata initCode) external",
    "function getNonce(address sender, uint192 key) external view returns (uint256 nonce)",
    "function supportedEntryPoints() public view returns (address[])"
];

async function main() {
    console.log("🔍 Validating v0.6 stack on Rootstock Testnet\n");

    const rpcUrl = process.env.RSK_TESTNET_RPC_URL || "http://localhost:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.RSK_PRIVATE_KEY || "", provider);

    const ENTRYPOINT_ADDRESS = process.env.ENTRY_POINT_ADDRESS || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    const FACTORY_ADDRESS = process.env.EXISTING_FACTORY_ADDRESS || "0xbfcb48c54cbf62488bbef4c53137c8d6659deb35";

    console.log("📋 Wallet:", wallet.address);
    console.log("📝 EntryPoint Address:", ENTRYPOINT_ADDRESS);
    console.log("📝 Factory Address:", FACTORY_ADDRESS);

    // Connect to EP
    const entryPoint = new ethers.Contract(
        ENTRYPOINT_ADDRESS,
        ENTRYPOINT_ABI,
        provider
    );

    // Test 1: Check if EntryPoint exists and is accessible
    console.log("\n✅ Test 1: EntryPoint connectivity");
    try {
        const code = await provider.getCode(ENTRYPOINT_ADDRESS);
        if (code === "0x") {
            console.log("❌ EntryPoint not deployed at", ENTRYPOINT_ADDRESS);
            throw new Error("EntryPoint not found");
        }
        console.log("✅ EntryPoint deployed (bytecode size: " + (code.length - 2) / 2 + " bytes)");
    } catch (err: any) {
        console.error("❌ Error:", err.message);
        throw err;
    }

    // Test 2: Check supported entry points via bundler RPC
    console.log("\n✅ Test 2: Checking eth_supportedEntryPoints via bundler");
    try {
        const bundlerUrl = process.env.BUNDLER_RPC_URL || "";
        if (!bundlerUrl) {
            console.log("⚠️  BUNDLER_RPC_URL not set");
        } else {
            const response = await fetch(bundlerUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "eth_supportedEntryPoints",
                    params: []
                })
            });
            const data = (await response.json()) as {
                result?: string[];
                error?: { message?: string };
            };
            if (data!.result) {
                console.log("✅ Supported EntryPoints from bundler:", data!.result);
                if (!data!.result.includes(ENTRYPOINT_ADDRESS.toLowerCase()) && !data!.result.includes(ENTRYPOINT_ADDRESS)) {
                    console.log("⚠️  Configured EntryPoint NOT in bundler list");
                }
            } else if (data!.error) {
                console.log("❌ Bundler error:", data!.error?.message);
            }
        }
    } catch (err: any) {
        console.log("⚠️  Could not check bundler:", err.message);
    }

    // Test 3: Check if Factory exists
    console.log("\n✅ Test 3: Factory connectivity");
    try {
        const factoryCode = await provider.getCode(FACTORY_ADDRESS);
        if (factoryCode === "0x") {
            console.log("❌ Factory not deployed at", FACTORY_ADDRESS);
            throw new Error("Factory not found");
        }
        console.log("✅ Factory deployed");
    } catch (err: any) {
        console.error("❌ Error:", err.message);
    }

    // Test 4: Try to get a sender address
    console.log("\n✅ Test 4: Computing sender address");
    try {
        const AccountFactoryFactory = new ethers.ContractFactory(
            AccountFactoryArtifact.abi,
            AccountFactoryArtifact.bytecode,
            wallet
        );

        let initCode = FACTORY_ADDRESS + AccountFactoryFactory.interface
            .encodeFunctionData("createAccount", [wallet.address])
            .slice(2);

        let sender: string | undefined;
        try {
            await entryPoint.getSenderAddress(initCode);
        } catch (ex: any) {
            const revertData = ex?.data as string | undefined;
            if (typeof revertData === "string" && revertData.length >= 40) {
                sender = ethers.getAddress("0x" + revertData.slice(-40));
            }
        }

        if (!sender) {
            const factory = new ethers.Contract(
                FACTORY_ADDRESS,
                AccountFactoryArtifact.abi,
                provider
            );
            sender = await factory.getAddress(wallet.address);
        }

        if (!sender) {
            throw new Error("No se pudo derivar sender desde getSenderAddress");
        }

        console.log("✅ Computed sender:", sender);

        // Check if already exists
        const code = await provider.getCode(sender);
        if (code !== "0x") {
            console.log("✅ Account already exists at", sender);
        } else {
            console.log("ℹ️  Account will be created at", sender);
        }

        // Check nonce
        try {
            const nonce = await entryPoint.getNonce(sender, 0);
            console.log("✅ Current nonce:", nonce.toString());
        } catch (err: any) {
            console.log("⚠️  Could not read nonce (account might not exist yet)");
        }

    } catch (err: any) {
        console.error("❌ Error:", err.message);
    }

    console.log("\n✅ Validation complete!");
    console.log("\n📝 Next: Run 'npm run aa:execute:v06' to send a UserOp");
}

main().catch(error => {
    console.error("❌ Script error:", error.message);
    process.exitCode = 1;
});
