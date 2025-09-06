#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

console.log("🎉 FestFund Setup Script");
console.log("Setting up your privacy-first donation platform...\n");

async function setupProject() {
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`✅ Node.js version: ${nodeVersion}`);

    if (parseInt(nodeVersion.slice(1)) < 18) {
      console.log("❌ Node.js 18+ required");
      process.exit(1);
    }

    // Install dependencies
    console.log("📦 Installing dependencies...");

    // Root dependencies
    console.log("Installing root dependencies...");
    execSync("npm install", { stdio: "inherit" });

    // Backend dependencies
    console.log("Installing backend dependencies...");
    process.chdir("backend");
    execSync("npm install", { stdio: "inherit" });

    // Frontend dependencies
    console.log("Installing frontend dependencies...");
    process.chdir("../frontend");
    execSync("npm install", { stdio: "inherit" });
    process.chdir("..");

    // Setup environment files
    console.log("⚙️ Setting up environment files...");

    // Copy .env.example to .env if it doesn't exist (centralized approach)
    const envPath = ".env";

    if (!fs.existsSync(envPath)) {
      fs.copyFileSync(".env.example", envPath);
      console.log(`✅ Created ${envPath} (centralized configuration)`);
    } else {
      console.log(`⚠️ ${envPath} already exists, skipping...`);
    }

    // Create logs directory
    const logsDir = "backend/logs";
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log(`✅ Created ${logsDir} directory`);
    }

    // Setup complete
    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Update .env files with your configuration");
    console.log("2. Start MongoDB (or update MONGODB_URI for cloud database)");
    console.log("3. Run: npm run dev");
    console.log("4. Open http://localhost:3000 in your browser");

    console.log("\n🚀 Quick start commands:");
    console.log("npm run dev         # Start development servers");
    console.log("npm run build       # Build for production");
    console.log("npm run start       # Start production servers");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run setup
setupProject();
