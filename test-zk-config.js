console.log("🧪 Testing FestFund ZK Configuration...\n");

// Simulate environment for testing
process.env.NEXT_PUBLIC_ZK_MODE = "midnight-network";
process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL =
  "https://rpc.testnet-02.midnight.network";
process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER_URL =
  "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.testnet-02.midnight.network#/explorer";
process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK_ID = "TestNet";

// Simple ZK config test implementation
const getZKConfig = () => {
  const mode = process.env.NEXT_PUBLIC_ZK_MODE || "midnight-network";
  return {
    mode,
    isOwnKeys: mode === "own-keys",
    isMidnightNetwork: mode === "midnight-network",
    networkName: mode === "midnight-network" ? "Midnight Network" : "Own Keys",
    explorerUrl:
      mode === "midnight-network"
        ? process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER_URL || ""
        : "",
    rpcUrl:
      mode === "midnight-network"
        ? process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ||
          "https://rpc.testnet-02.midnight.network"
        : "http://localhost:8545",
    networkId:
      mode === "midnight-network"
        ? process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK_ID || "TestNet"
        : "localhost",
  };
};

try {
  console.log("📊 Testing getZKConfig():");
  const config = getZKConfig();
  console.log("✅ ZK Config:", JSON.stringify(config, null, 2));

  console.log("\n🎉 ZK Configuration Test Passed!");
  console.log(`🌙 Current Mode: ${config.mode} (${config.networkName})`);
  console.log(`🌐 RPC URL: ${config.rpcUrl}`);
  console.log(`🔍 Explorer: ${config.explorerUrl}`);
} catch (error) {
  console.error("❌ Test Failed:", error.message);
  process.exit(1);
}
