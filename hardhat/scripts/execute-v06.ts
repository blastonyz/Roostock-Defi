import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config({ override: true });

// EntryPoint v0.6 ABI (minimal)
const ENTRYPOINT_ABI = [
    "function getSenderAddress(bytes calldata initCode) external",
    "function getNonce(address sender, uint192 key) external view returns (uint256 nonce)",
    "function getUserOpHash(tuple(address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature) userOp) external view returns (bytes32)",
    "function handleOps(tuple(address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[] calldata ops, address payable beneficiary)",
    "function estimateGas(tuple(address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes) userOp, bytes calldata initCode, bytes calldata signature) external"
];

// Importar artefactos locales
import AccountArtifact from "../artifacts/contracts/AccountV06.sol/AccountV06.json";
import AccountFactoryArtifact from "../artifacts/contracts/AccountFactoryV06.sol/AccountFactoryV06.json";

// ===== CONFIG v0.6 =====
const ENTRYPOINT_ADDRESS = process.env.ENTRY_POINT_ADDRESS || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const FACTORY_ADDRESS = process.env.EXISTING_FACTORY_ADDRESS || "0xbfcb48c54cbf62488bbef4c53137c8d6659deb35";
const PAYMASTER_ADDRESS = process.env.EXISTING_PAYMASTER_ADDRESS || "0xd8ed7139feef8775c8a6c9974da8bb8df22868c1";
const CHAIN_ID = 31; // Rootstock testnet
const USE_PAYMASTER = (process.env.AA_USE_PAYMASTER || "false").toLowerCase() === "true";
const PREFUND_TARGET = ethers.parseEther("0.0002");

function buildPaymasterAndData(paymaster: string): string {
    return paymaster.toLowerCase().startsWith("0x") ? paymaster : `0x${paymaster}`;
}

// UserOp formato unpacked para bundler
type UserOpUnpacked = {
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

async function bundlerRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
    });

    const raw = await response.text();
    let data: { result?: T; error?: { message?: string; code?: number; data?: unknown } } | undefined;

    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error(`HTTP ${response.status} ${response.statusText} | body: ${raw}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} | body: ${raw}`);
    }

    if (data.error) {
        throw new Error(`${data.error.code ?? ""} ${data.error.message ?? ""} ${JSON.stringify(data.error.data ?? null)}`.trim());
    }

    if (data.result === undefined) {
        throw new Error(`RPC ${method} sin result`);
    }

    return data.result;
}

async function main() {
    console.log("🚀 Execute UserOp (v0.6) on Rootstock Testnet\n");

    // Conectar
    const rpcUrl = process.env.RSK_TESTNET_RPC_URL || "http://localhost:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.RSK_PRIVATE_KEY || "", provider);

    console.log("📋 Wallet:", wallet.address);
    console.log("📝 EntryPoint:", ENTRYPOINT_ADDRESS);
    console.log("📝 Factory:", FACTORY_ADDRESS);
    console.log("📝 Chain:", CHAIN_ID);

    const entryPoint = new ethers.Contract(
        ENTRYPOINT_ADDRESS,
        ENTRYPOINT_ABI,
        wallet
    );

    const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        AccountFactoryArtifact.abi,
        wallet
    );

    // ===== STEP 1: Calcular sender address via getSenderAddress =====
    console.log("\n⏳ Calculating sender address...");

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
        sender = await factory["getAddress(address)"](wallet.address);
    } catch {
        // ignore
    }

    if (!sender) {
        throw new Error("No se pudo derivar sender desde getSenderAddress");
    }

    console.log("✅ Sender:", sender);

    const account = new ethers.Contract(
        sender!,
        AccountArtifact.abi,
        provider
    );

    // ===== STEP 2: Verificar si la cuenta existe =====
    const code = await provider.getCode(sender!);
    const accountExists = code !== "0x";

    console.log(`\n📊 Account exists: ${accountExists}`);

    if (accountExists) {
        initCode = "0x";
        console.log("✅ Using existing account (no initCode needed)");
    } else {
        console.log("⚠️  Will create new account");
    }

    // ===== STEP 3: Verificar balance =====
    let currentBalance = await provider.getBalance(sender!);
    console.log(`💰 Account balance: ${ethers.formatEther(currentBalance)} tRBTC`);

    if (!USE_PAYMASTER && currentBalance < PREFUND_TARGET) {
        console.log("⛽ Prefunding smart account (no paymaster mode)...");
        const topup = PREFUND_TARGET - currentBalance;
        const tx = await wallet.sendTransaction({ to: sender, value: topup });
        await tx.wait();
        currentBalance = await provider.getBalance(sender);
        console.log(`✅ New account balance: ${ethers.formatEther(currentBalance)} tRBTC`);
    }

    // ===== STEP 4: Armar UserOp base SIN firma =====
    console.log("\n🔧 Building UserOp...");

    const userOpForHash: UserOpUnpacked = {
        sender: sender!,
        nonce: "0x" + (await entryPoint.getNonce(sender!, 0)).toString(16),
        initCode,
        callData: account.interface.encodeFunctionData("execute", [
            wallet.address, // destino (en este caso a sí mismo, o target)
            0n, // value
            "0x" // data
        ]),
        callGasLimit: "0x30d40",        // 200k
        verificationGasLimit: "0x493e0", // 300k
        preVerificationGas: "0x1d4c0",   // 120k
        maxFeePerGas: "0x0",             // será reemplazado
        maxPriorityFeePerGas: "0x0",     // será reemplazado
        paymasterAndData: USE_PAYMASTER ? buildPaymasterAndData(PAYMASTER_ADDRESS) : "0x",
        signature: "0x"                  // placeholder para hash
    };

    // ===== STEP 5: Calcular hash del UserOp =====
    console.log("🔐 Computing UserOp hash...");

    const userOpHash = await entryPoint.getUserOpHash(userOpForHash);
    console.log("✅ Hash:", userOpHash);

    // ===== STEP 6: Firmar el hash =====
    console.log("✍️  Signing...");

    const sig = await wallet.signMessage(ethers.getBytes(userOpHash));
    console.log("✅ Signature:", sig);

    const bundlerRpcUrl = process.env.BUNDLER_RPC_URL || "";
    if (!bundlerRpcUrl) {
        throw new Error("BUNDLER_RPC_URL no configurada");
    }

    // ===== STEP 7: Estimar gas =====
    console.log("\n⏳ Estimating gas...");

    let gasEstimate: {
        callGasLimit?: string;
        verificationGasLimit?: string;
        preVerificationGas?: string;
    };
    try {
        gasEstimate = await bundlerRpc<{
            callGasLimit?: string;
            verificationGasLimit?: string;
            preVerificationGas?: string;
        }>(bundlerRpcUrl, "eth_estimateUserOperationGas", [
            {
                sender: userOpForHash.sender,
                nonce: userOpForHash.nonce,
                initCode: userOpForHash.initCode,
                callData: userOpForHash.callData,
                callGasLimit: userOpForHash.callGasLimit,
                verificationGasLimit: userOpForHash.verificationGasLimit,
                preVerificationGas: userOpForHash.preVerificationGas,
                maxFeePerGas: "0x1",
                maxPriorityFeePerGas: "0x1",
                paymasterAndData: userOpForHash.paymasterAndData,
                signature: sig
            },
            ENTRYPOINT_ADDRESS
        ]);

        console.log("✅ Gas estimate:", gasEstimate);
    } catch (err: any) {
        console.error("❌ Estimate failed:", err.message);
        if (err.data) console.error("  Data:", err.data);
        throw err;
    }

    // ===== STEP 8: Obtener gas prices =====
    const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();
    const finalMaxFeePerGas = gasEstimate.maxFeePerGas || (maxFeePerGas ? "0x" + maxFeePerGas.toString(16) : "0x189c090");
    const finalMaxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas || (maxPriorityFeePerGas ? "0x" + maxPriorityFeePerGas.toString(16) : finalMaxFeePerGas);

    console.log(
        `\n⛽ Gas prices:\n  maxFeePerGas: ${finalMaxFeePerGas}\n  maxPriorityFeePerGas: ${finalMaxPriorityFeePerGas}`
    );

    // ===== STEP 9: Armar UserOp final =====
    const userOp: UserOpUnpacked = {
        sender: userOpForHash.sender,
        nonce: userOpForHash.nonce,
        initCode: userOpForHash.initCode,
        callData: userOpForHash.callData,
        callGasLimit: gasEstimate.callGasLimit || userOpForHash.callGasLimit,
        verificationGasLimit: gasEstimate.verificationGasLimit || userOpForHash.verificationGasLimit,
        preVerificationGas: gasEstimate.preVerificationGas || userOpForHash.preVerificationGas,
        maxFeePerGas: finalMaxFeePerGas,
        maxPriorityFeePerGas: finalMaxPriorityFeePerGas,
        paymasterAndData: userOpForHash.paymasterAndData,
        signature: sig
    };

    console.log("\n📦 Final UserOp:");
    console.log(JSON.stringify(userOp, null, 2));

    // ===== STEP 10: Enviar UserOp =====
    console.log("\n📤 Sending UserOp...");

    const bundlerResponse = await fetch(bundlerRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendUserOperation",
            params: [userOp, ENTRYPOINT_ADDRESS]
        })
    });

    const result = (await bundlerResponse.json()) as {
        result?: string;
        error?: { message?: string; code?: number; data?: unknown };
    };

    if (result.error) {
        console.error("❌ Bundler error:", result.error);
        throw new Error(result.error.message || "Bundler error");
    }

    const opHash = result.result;
    if (!opHash) {
        throw new Error("eth_sendUserOperation no devolvió hash");
    }
    console.log("✅ UserOp hash:", opHash);

    const byHash = await bundlerRpc<unknown | null>(bundlerRpcUrl, "eth_getUserOperationByHash", [opHash]);
    if (!byHash) {
        console.log("⚠️ Bundler devolvió hash pero no dejó el op en mempool (eth_getUserOperationByHash = null)");
    }

    // ===== STEP 11: Esperar receipt =====
    console.log("\n⏳ Waiting for receipt...");

    let receipt: { result?: unknown } | null = null;
    let attempts = 0;
    const maxAttempts = 30;

    while ((receipt === null || !receipt.result) && attempts < maxAttempts) {
        try {
            receipt = (await fetch(bundlerRpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "eth_getUserOperationReceipt",
                    params: [opHash]
                })
            }).then(r => r.json())) as { result?: unknown };

            if (receipt.result) {
                console.log("\n✅ Receipt received!");
                console.log(JSON.stringify(receipt.result, null, 2));
                break;
            }
        } catch {}

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        process.stdout.write(".");
    }

    if (!receipt || !receipt.result) {
        console.log("\n⚠️  Receipt timeout after 60 seconds");
    }
}

main().catch(error => {
    console.error("❌ Script error:", error.message);
    process.exitCode = 1;
});
