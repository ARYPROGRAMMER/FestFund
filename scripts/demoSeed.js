const { ethers } = require("hardhat");
const axios = require("axios");

const BACKEND_URL = "http://localhost:3001";

async function main() {
  console.log("🌱 Seeding FestFund with demo data...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Read contract addresses
  const fs = require("fs");
  const path = require("path");

  let contracts;
  try {
    const contractsPath = path.join(__dirname, "../frontend/contracts.json");
    contracts = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
  } catch (error) {
    console.error(
      "❌ Could not read contracts.json. Please run deploy script first."
    );
    process.exit(1);
  }

  // Get contract instances
  const FundManager = await ethers.getContractFactory("FundManager");
  const fundManager = FundManager.attach(contracts.fundManager.address);

  console.log("📦 Using FundManager at:", contracts.fundManager.address);

  // Demo events to create
  const demoEvents = [
    {
      name: "Tech Conference 2024",
      description:
        "Annual technology conference with cutting-edge speakers and workshops on AI, blockchain, and web development.",
      milestones: ["1000", "5000", "10000"],
    },
    {
      name: "Community Arts Festival",
      description:
        "Supporting local artists and creative community with exhibitions, performances, and workshops.",
      milestones: ["500", "2000", "7500"],
    },
    {
      name: "Open Source Hackathon",
      description:
        "48-hour hackathon focused on building open source tools and libraries for the developer community.",
      milestones: ["750", "3000", "8000"],
    },
  ];

  console.log("\n🎭 Creating demo events...");

  for (let i = 0; i < demoEvents.length; i++) {
    const event = demoEvents[i];

    try {
      console.log(`\n📝 Creating event: ${event.name}`);

      // Create event on blockchain
      const tx = await fundManager.createEvent(
        event.name,
        event.description,
        event.milestones
      );

      const receipt = await tx.wait();
      console.log("⛓️  Event created on blockchain, tx:", receipt.hash);

      // Get event ID from logs
      const eventCreatedLog = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "EventCreated"
      );

      let eventId;
      if (eventCreatedLog) {
        eventId = eventCreatedLog.args[0].toString();
      } else {
        // Fallback: calculate expected event ID
        eventId = (i + 1).toString();
      }

      console.log("🎫 Event ID:", eventId);

      // Create event in backend database
      try {
        const backendData = {
          eventId: eventId,
          name: event.name,
          description: event.description,
          organizer: deployer.address,
          milestones: event.milestones,
        };

        const response = await axios.post(
          `${BACKEND_URL}/api/proof/create-event`,
          backendData
        );

        if (response.data.success) {
          console.log("💾 Event created in backend database");
          console.log(
            "🎨 Generated milestone names:",
            response.data.event.milestoneNames
          );
        }
      } catch (backendError) {
        console.warn(
          "⚠️  Backend event creation failed:",
          backendError.message
        );
        console.log(
          "💡 Make sure the backend server is running on",
          BACKEND_URL
        );
      }
    } catch (error) {
      console.error(`❌ Failed to create event ${event.name}:`, error.message);
    }
  }

  console.log("\n🤝 Creating demo commitments...");

  // Create some demo accounts for commitments
  const demoWallets = [];
  for (let i = 0; i < 5; i++) {
    const wallet = ethers.Wallet.createRandom().connect(ethers.provider);

    // Fund the wallet
    const fundTx = await deployer.sendTransaction({
      to: wallet.address,
      value: ethers.parseEther("1.0"),
    });
    await fundTx.wait();

    demoWallets.push(wallet);
  }

  // Demo commitments for the first event
  const eventId = "1";
  const demoCommitments = [
    { amount: "500", wallet: demoWallets[0] },
    { amount: "800", wallet: demoWallets[1] },
    { amount: "300", wallet: demoWallets[2] },
    { amount: "1200", wallet: demoWallets[3] },
    { amount: "600", wallet: demoWallets[4] },
  ];

  for (let i = 0; i < demoCommitments.length; i++) {
    const { amount, wallet } = demoCommitments[i];

    try {
      console.log(
        `\n💰 Creating commitment for ${amount} tokens from ${wallet.address.slice(
          0,
          6
        )}...`
      );

      // Generate commitment
      const nonce = ethers.randomBytes(32);
      const nonceHex = ethers.hexlify(nonce);

      // Create commitment hash (simple hash for demo)
      const commitmentData = ethers.solidityPackedKeccak256(
        ["string", "bytes32"],
        [amount, nonceHex]
      );

      // Submit commitment to blockchain
      const fundManagerWithWallet = fundManager.connect(wallet);
      const tx = await fundManagerWithWallet.submitCommitment(
        eventId,
        commitmentData
      );
      await tx.wait();

      console.log("⛓️  Commitment submitted to blockchain");

      // Submit to backend
      try {
        const backendCommitment = {
          eventId: eventId,
          commitmentHash: commitmentData,
          donorAddress: wallet.address,
        };

        await axios.post(
          `${BACKEND_URL}/api/proof/submit-commitment`,
          backendCommitment
        );
        console.log("💾 Commitment saved to backend");

        // Store commitment data for proof generation
        const commitmentData_local = {
          amount: amount,
          nonce: nonceHex,
          eventId: eventId,
        };

        console.log(
          `💾 Local commitment data: ${JSON.stringify(commitmentData_local)}`
        );
      } catch (backendError) {
        console.warn("⚠️  Backend commitment failed:", backendError.message);
      }
    } catch (error) {
      console.error(`❌ Failed to create commitment:`, error.message);
    }
  }

  console.log("\n🎉 Demo seeding completed!");
  console.log("\n📋 Summary:");
  console.log("- Created", demoEvents.length, "demo events");
  console.log(
    "- Created",
    demoCommitments.length,
    "demo commitments for event 1"
  );
  console.log("- Funded", demoWallets.length, "demo wallets");
  console.log("\n🌐 Access the app at: http://localhost:3000");
  console.log("💼 Import wallets to MetaMask using these private keys:");
  demoWallets.forEach((wallet, i) => {
    console.log(`Wallet ${i + 1}: ${wallet.privateKey}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo seeding failed:", error);
    process.exit(1);
  });
