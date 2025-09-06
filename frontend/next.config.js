const path = require('path');
const fs = require('fs');

// Load environment variables from root .env file
function loadRootEnv() {
  const rootEnvPath = path.join(__dirname, '..', '.env');
  const env = {};
  
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          
          // Handle variable substitution for ${USE_MOCK_MODE}
          if (value.includes('${USE_MOCK_MODE}')) {
            const mockMode = env.USE_MOCK_MODE || process.env.USE_MOCK_MODE || 'true';
            value = value.replace(/\$\{USE_MOCK_MODE\}/g, mockMode);
          }
          
          env[key.trim()] = value;
        }
      }
    });
  }
  
  return env;
}

const rootEnv = loadRootEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // Load all NEXT_PUBLIC_ variables from root .env
    ...Object.fromEntries(
      Object.entries(rootEnv).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    ),
    // Ensure critical variables are available
    NEXT_PUBLIC_BACKEND_URL: rootEnv.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
    NEXT_PUBLIC_CHAIN_ID: rootEnv.NEXT_PUBLIC_CHAIN_ID || "1",
    NEXT_PUBLIC_USE_MOCK_WALLET: rootEnv.NEXT_PUBLIC_USE_MOCK_WALLET || rootEnv.USE_MOCK_MODE || "true",
    NEXT_PUBLIC_ZK_MODE: rootEnv.NEXT_PUBLIC_ZK_MODE || rootEnv.ZK_MODE || "midnight-network",
  },
  webpack: (config, { isServer }) => {
    // Handle ES modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
