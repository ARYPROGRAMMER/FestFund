#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk");

console.log(chalk.blue.bold("🚀 FestFund Production Deployment"));
console.log(
  chalk.gray("Preparing your application for production deployment...\n")
);

async function deploySetup() {
  try {
    // Check environment
    const nodeEnv = process.env.NODE_ENV;
    console.log(chalk.yellow(`📋 Environment: ${nodeEnv || "development"}`));

    if (nodeEnv !== "production") {
      console.log(
        chalk.red('⚠️ NODE_ENV should be set to "production" for deployment')
      );
    }

    // Build applications
    console.log(chalk.yellow("🔨 Building applications..."));

    // Build backend
    console.log(chalk.gray("Building backend..."));
    process.chdir("backend");
    if (fs.existsSync("package.json")) {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      if (pkg.scripts && pkg.scripts.build) {
        execSync("npm run build", { stdio: "inherit" });
      } else {
        console.log(
          chalk.gray("No build script found for backend, skipping...")
        );
      }
    }

    // Build frontend
    console.log(chalk.gray("Building frontend..."));
    process.chdir("../frontend");
    execSync("npm run build", { stdio: "inherit" });
    process.chdir("..");

    // Validate environment variables
    console.log(chalk.yellow("🔧 Validating environment configuration..."));

    const requiredEnvVars = [
      "MONGODB_URI",
      "JWT_SECRET",
      "SESSION_SECRET",
      "NEXT_PUBLIC_BACKEND_URL",
    ];

    const missingVars = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      console.log(chalk.red("❌ Missing required environment variables:"));
      missingVars.forEach((varName) => {
        console.log(chalk.red(`   - ${varName}`));
      });
      console.log(
        chalk.yellow("\n💡 Update your .env file with production values")
      );
    } else {
      console.log(chalk.green("✅ All required environment variables are set"));
    }

    // Create production scripts
    console.log(chalk.yellow("📝 Creating production scripts..."));

    // Create start.sh for Unix systems
    const startScript = `#!/bin/bash
echo "Starting FestFund Production Server..."

# Start backend
cd backend
npm start &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
`;

    fs.writeFileSync("start.sh", startScript);
    console.log(chalk.green("✅ Created start.sh"));

    // Create Docker files if needed
    const createDockerFile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install --production
RUN cd frontend && npm install --production

# Copy source code
COPY . .

# Build applications
RUN cd frontend && npm run build

# Expose ports
EXPOSE 3000 3001

# Start command
CMD ["npm", "start"]
`;

    if (!fs.existsSync("Dockerfile")) {
      fs.writeFileSync("Dockerfile", createDockerFile);
      console.log(chalk.green("✅ Created Dockerfile"));
    }

    // Create docker-compose for production
    const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGO_ROOT_USERNAME:-admin}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGO_ROOT_PASSWORD:-password}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
`;

    if (!fs.existsSync("docker-compose.production.yml")) {
      fs.writeFileSync("docker-compose.production.yml", dockerCompose);
      console.log(chalk.green("✅ Created docker-compose.production.yml"));
    }

    // Deployment complete
    console.log(
      chalk.green.bold("\n🎉 Production deployment setup completed!")
    );

    console.log(chalk.blue("\n📋 Deployment options:"));
    console.log(chalk.cyan("1. Manual deployment:"));
    console.log(chalk.gray("   - Upload built files to your server"));
    console.log(chalk.gray("   - Set environment variables"));
    console.log(chalk.gray("   - Run: npm start"));

    console.log(chalk.cyan("\n2. Docker deployment:"));
    console.log(
      chalk.gray("   - docker-compose -f docker-compose.production.yml up -d")
    );

    console.log(chalk.cyan("\n3. Platform-specific:"));
    console.log(chalk.gray("   - Vercel (frontend): vercel --prod"));
    console.log(chalk.gray("   - Render (backend): Connect GitHub and deploy"));
    console.log(chalk.gray("   - Railway: railway up"));

    console.log(chalk.blue("\n🔧 Environment checklist:"));
    console.log(chalk.gray("✅ NODE_ENV=production"));
    console.log(chalk.gray("✅ MONGODB_URI (production database)"));
    console.log(chalk.gray("✅ JWT_SECRET (secure random key)"));
    console.log(chalk.gray("✅ SESSION_SECRET (secure random key)"));
    console.log(chalk.gray("✅ NEXT_PUBLIC_BACKEND_URL (production URL)"));
  } catch (error) {
    console.error(chalk.red("❌ Deployment setup failed:"), error.message);
    process.exit(1);
  }
}

// Run deployment setup
deploySetup();
