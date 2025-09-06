const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying FestFund contracts...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy MockERC20 token first
  console.log("\n📦 Deploying MockERC20 token...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy(
    "FestFund Token",
    "FFT",
    18,
    ethers.parseEther("1000000") // 1M tokens
  );
  await mockToken.waitForDeployment();

  const mockTokenAddress = await mockToken.getAddress();
  console.log("✅ MockERC20 deployed to:", mockTokenAddress);

  // Deploy Verifier contract
  console.log("\n📦 Deploying Verifier contract...");
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();

  const verifierAddress = await verifier.getAddress();
  console.log("✅ Verifier deployed to:", verifierAddress);

  // Deploy FundManager contract
  console.log("\n📦 Deploying FundManager contract...");
  const FundManager = await ethers.getContractFactory("FundManager");
  const fundManager = await FundManager.deploy(verifierAddress);
  await fundManager.waitForDeployment();

  const fundManagerAddress = await fundManager.getAddress();
  console.log("✅ FundManager deployed to:", fundManagerAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");

  // Test verifier version
  const version = await verifier.getVersion();
  console.log("📄 Verifier version:", version);

  // Test fund manager
  const nextEventId = await fundManager.nextEventId();
  console.log("🎫 Next event ID:", nextEventId.toString());

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    mockToken: {
      address: mockTokenAddress,
      name: "FestFund Token",
      symbol: "FFT",
      decimals: 18,
    },
    verifier: {
      address: verifierAddress,
      version: version,
    },
    fundManager: {
      address: fundManagerAddress,
      nextEventId: nextEventId.toString(),
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log("Network:", deploymentInfo.network);
  console.log("Verifier:", deploymentInfo.verifier.address);
  console.log("FundManager:", deploymentInfo.fundManager.address);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Timestamp:", deploymentInfo.timestamp);
  console.log("================================");

  // Write to file for frontend use
  const fs = require("fs");
  const path = require("path");

  const outputPath = path.join(__dirname, "../frontend/contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📁 Contract info saved to:", outputPath);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Start the backend server: cd backend && npm run dev");
  console.log("2. Start the frontend: cd frontend && npm run dev");
  console.log("3. Connect MetaMask to localhost:8545");
  console.log(
    "4. Import the deployer account using private key from hardhat.config.js"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
