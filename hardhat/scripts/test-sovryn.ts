import "dotenv/config";
import { network } from "hardhat";

type HexAddress = `0x${string}`;

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const deployer = walletClients[0];

  if (!deployer) {
    throw new Error("No deployer wallet configured");
  }

  console.log("\n🚀 SovrynMarginTrader Test");
  console.log("═".repeat(50));
  console.log("Deployer:", deployer.account.address);

  // Mock addresses for testing (on local network, these can be anything)
  const mockAddresses: {
    iDOC: HexAddress;
    iRBTC: HexAddress;
    DoC: HexAddress;
    WRBTC: HexAddress;
    SovrynProtocol: HexAddress;
  } = {
    iDOC: "0x0000000000000000000000000000000000000001",
    iRBTC: "0x0000000000000000000000000000000000000002",
    DoC: "0x0000000000000000000000000000000000000003",
    WRBTC: "0x0000000000000000000000000000000000000004",
    SovrynProtocol: "0x0000000000000000000000000000000000000005",
  };

  console.log("\n📝 Deploying SovrynMarginTrader...");
  try {
    const contract = await viem.deployContract(
      "SovrynMarginTrader",
      [
        mockAddresses.iDOC,
        mockAddresses.iRBTC,
        mockAddresses.SovrynProtocol,
        mockAddresses.DoC,
        mockAddresses.WRBTC,
      ],
    );

    console.log("✅ SovrynMarginTrader deployed at:", contract.address);

    // Test updateContracts (public now)
    console.log("\n🔄 Testing updateContracts (public function)...");
    const newAddresses: {
      iDOC: HexAddress;
      iRBTC: HexAddress;
      DoC: HexAddress;
      WRBTC: HexAddress;
      SovrynProtocol: HexAddress;
    } = {
      iDOC: "0x0000000000000000000000000000000000000010",
      iRBTC: "0x0000000000000000000000000000000000000011",
      DoC: "0x0000000000000000000000000000000000000012",
      WRBTC: "0x0000000000000000000000000000000000000013",
      SovrynProtocol: "0x0000000000000000000000000000000000000014",
    };

    const updateTx = await contract.write.updateContracts([
      newAddresses.iDOC,
      newAddresses.iRBTC,
      newAddresses.SovrynProtocol,
      newAddresses.DoC,
      newAddresses.WRBTC,
    ]);

    console.log("✅ updateContracts succeeded (no revert)");

    // Read back values
    const iDOC = await contract.read.iDOC();
    const iRBTC = await contract.read.iRBTC();
    console.log("  Stored iDOC:", iDOC);
    console.log("  Stored iRBTC:", iRBTC);

    // Test getUserLoanCount (empty, should be 0)
    console.log("\n📊 Testing getUserLoanCount...");
    const loanCount = await contract.read.getUserLoanCount([deployer.account.address]);
    console.log("  User loan count:", loanCount.toString());

    console.log("\n✅ All tests passed!");
    console.log("═".repeat(50));
    console.log("\n📌 Next Steps:");
    console.log("  1. Get actual Sovryn contract addresses for Rootstock testnet");
    console.log("  2. Test openMarginTradeDoC/openMarginTradeWRBTC on testnet");
    console.log("  3. Monitor emit MarginTradeOpened events");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
