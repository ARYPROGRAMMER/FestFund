require("@nomicfoundation/hardhat-toolbox");

// Load appropriate .env file based on network
const path = require("path");
if (process.env.HARDHAT_NETWORK === "sepolia") {
  require("dotenv").config({ path: './backend/.env.production' });
  console.log("🔧 Loading backend/.env.production for Sepolia");
} else {
  require("dotenv").config(); // Load root .env for localhost
  console.log("🔧 Loading root .env for localhost");
}

console.log("🔧 Hardhat Config Loaded:");
console.log("- Network:", process.env.HARDHAT_NETWORK || "localhost");
console.log("- BLOCKCHAIN_RPC:", process.env.BLOCKCHAIN_RPC ? "✅ Set" : "❌ Missing");
console.log("- PRIVATE_KEY:", process.env.PRIVATE_KEY ? `✅ Set (${process.env.PRIVATE_KEY.length} chars)` : "❌ Missing");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat Account #0
      ],
    },
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC || "https://sepolia.infura.io/v3/040357f0d2724c4fa5c9a00659a7c77c",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 
        ? [`0x${process.env.PRIVATE_KEY}`] 
        : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
