// ZK Mode Configuration and Detection Utility
export type ZKMode = "own-keys" | "midnight-network";

export interface ZKConfig {
  mode: ZKMode;
  isOwnKeys: boolean;
  isMidnightNetwork: boolean;
  networkName: string;
  explorerUrl: string;
  rpcUrl: string;
  networkId: string;
}

/**
 * Get current ZK mode configuration from environment
 */
export function getZKConfig(): ZKConfig {
  // Force read from environment variable, with explicit debugging
  const envMode = process.env.NEXT_PUBLIC_ZK_MODE;

  // Force log to console every time this function is called
  const debugInfo = {
    envVariable: envMode,
    processEnv:
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_ZK_MODE
        : "undefined",
    allEnvVars:
      typeof process !== "undefined"
        ? Object.keys(process.env).filter((key) =>
            key.startsWith("NEXT_PUBLIC_")
          )
        : [],
    timestamp: new Date().toISOString(),
  };

  console.log("🔍 ZK Mode Debug:", debugInfo);
  console.warn(
    "🚨 Current ZK Mode:",
    envMode || "UNDEFINED - DEFAULTING TO MIDNIGHT"
  );

  // Use environment variable or default to midnight-network
  const mode = (envMode || "midnight-network") as ZKMode;
  console.log("🔧 Final Mode Selected:", mode);

  const config: ZKConfig = {
    mode,
    isOwnKeys: mode === "own-keys",
    isMidnightNetwork: mode === "midnight-network",
    networkName: mode === "midnight-network" ? "Midnight Network" : "Own Keys",
    explorerUrl:
      mode === "midnight-network"
        ? process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER_URL ||
          "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.testnet-02.midnight.network#/explorer"
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

  return config;
}

/**
 * Get ZK mode display information
 */
export function getZKModeInfo(config?: ZKConfig) {
  const zkConfig = config || getZKConfig();

  return {
    name: zkConfig.networkName,
    description: zkConfig.isMidnightNetwork
      ? "Official Midnight Network testnet-02 integration with ~1ms commitment generation"
      : "Self-hosted ZK infrastructure with ~418ms proof generation",
    icon: zkConfig.isMidnightNetwork ? "🌙" : "🔑",
    performance: zkConfig.isMidnightNetwork ? "~1ms" : "~418ms",
    privacy: zkConfig.isMidnightNetwork
      ? "Midnight Network Privacy"
      : "Self-Sovereign Privacy",
    connectivity: zkConfig.isMidnightNetwork
      ? "Official testnet-02"
      : "Local infrastructure",
    benefits: zkConfig.isMidnightNetwork
      ? [
          "Official Midnight SDK",
          "Scalable infrastructure",
          "1ms commitments",
          "Production-ready",
        ]
      : [
          "Complete sovereignty",
          "No dependencies",
          "Real ZK proofs",
          "Full control",
        ],
  };
}

/**
 * Check if current environment supports the selected ZK mode
 */
export function validateZKMode(): { isValid: boolean; errors: string[] } {
  const config = getZKConfig();
  const errors: string[] = [];

  if (config.isMidnightNetwork) {
    if (!config.rpcUrl) {
      errors.push(
        "NEXT_PUBLIC_MIDNIGHT_RPC_URL is required for Midnight Network mode"
      );
    }
    if (!config.networkId) {
      errors.push(
        "NEXT_PUBLIC_MIDNIGHT_NETWORK_ID is required for Midnight Network mode"
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get transaction explorer URL for the current ZK mode
 */
export function getTransactionUrl(txHash: string, config?: ZKConfig): string {
  const zkConfig = config || getZKConfig();

  if (zkConfig.isMidnightNetwork && zkConfig.explorerUrl) {
    return `${zkConfig.explorerUrl}/tx/${txHash}`;
  }

  // For own-keys mode, no explorer URL
  return "";
}

/**
 * Get commitment verification URL
 */
export function getCommitmentVerificationUrl(
  commitmentHash: string,
  config?: ZKConfig
): string {
  const zkConfig = config || getZKConfig();

  if (zkConfig.isMidnightNetwork) {
    return `${zkConfig.explorerUrl}/commitment/${commitmentHash}`;
  }

  return "";
}
