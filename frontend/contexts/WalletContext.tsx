import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import axios from "axios";
import toast from "react-hot-toast";

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  sessionToken: string | null;
  connectWallet: (skipBackendCall?: boolean) => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  updateActivity: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Wallet mode configuration
const USE_MOCK_WALLET = process.env.NEXT_PUBLIC_USE_MOCK_WALLET === "true";

// Support multiple popular networks
const SUPPORTED_NETWORKS = {
  1: "Ethereum Mainnet",
  137: "Polygon Mainnet",
  11155111: "Sepolia Testnet",
  80001: "Mumbai Testnet",
  31337: "Local Hardhat",
};

const DEFAULT_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1"); // Default to Ethereum mainnet

// Mock wallet data for testing
const MOCK_WALLET = {
  address: "0x742d35Cc6634C0532925a3b8D0FD67F4C0532925",
  chainId: DEFAULT_CHAIN_ID,
};

// Mock signer for testing (implements complete signer interface including payments)
class MockSigner {
  private address: string;

  constructor(address: string) {
    this.address = address;
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async signMessage(message: string): Promise<string> {
    console.log("MockSigner: Signing message:", message);
    // Generate a fake but consistent signature for testing
    // This is deterministic based on message content for consistent testing
    const hashValue = Math.abs(this.hashCode(message + this.address));
    const twoHexChars = (hashValue % 256).toString(16).padStart(2, "0");
    const fakeSignature = `0x${"0".repeat(130)}${twoHexChars}`;
    console.log(
      "MockSigner: Generated signature:",
      fakeSignature,
      "Length:",
      fakeSignature.length
    );
    return fakeSignature;
  }

  // Mock transaction implementation for testing payments
  async sendTransaction(transactionRequest: any): Promise<any> {
    console.log("MockSigner: Sending transaction:", transactionRequest);

    // Simulate transaction processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate a fake but realistic transaction hash
    const txData = `${this.address}${transactionRequest.to}${
      transactionRequest.value
    }${Date.now()}`;
    const txHash = `0x${this.hashCode(txData).toString(16).padStart(64, "0")}`;

    const mockTransaction = {
      hash: txHash,
      to: transactionRequest.to,
      value: transactionRequest.value,
      from: this.address,
      gasLimit: transactionRequest.gasLimit || 21000,
      gasPrice: "20000000000", // 20 Gwei
      nonce: Math.floor(Math.random() * 1000),
      chainId: 1,

      // Mock wait function for transaction confirmation
      wait: async (confirmations = 1) => {
        console.log(
          `MockSigner: Waiting for ${confirmations} confirmations...`
        );
        // Simulate confirmation delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const receipt = {
          transactionHash: txHash,
          blockNumber: Math.floor(Math.random() * 1000000) + 18500000,
          blockHash: `0x${Math.random()
            .toString(16)
            .substring(2)
            .padStart(64, "0")}`,
          gasUsed: transactionRequest.gasLimit || 21000,
          status: 1, // Success
          confirmations: confirmations,
          from: this.address,
          to: transactionRequest.to,
          logs: [],
        };

        console.log("MockSigner: Transaction confirmed:", receipt);
        return receipt;
      },
    };

    console.log("MockSigner: Transaction created:", mockTransaction.hash);
    return mockTransaction;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("festfund_session");
    const authToken = localStorage.getItem("authToken");

    // Only try to reconnect if we have both session and auth token
    // This prevents errors during registration process
    if (savedSession && authToken) {
      try {
        const session = JSON.parse(savedSession);
        if (session.sessionToken && session.account) {
          setSessionToken(session.sessionToken);
          // Try to reconnect
          reconnectWallet();
        }
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem("festfund_session");
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleDisconnect);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("disconnect", handleDisconnect);
      };
    }
  }, []);

  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        updateSession(accounts[0], sessionToken);
      }
    },
    [account, sessionToken]
  );

  const handleChainChanged = useCallback((chainId: string) => {
    const newChainId = parseInt(chainId, 16);
    setChainId(newChainId);

    // Check if network is supported
    if (!SUPPORTED_NETWORKS[newChainId as keyof typeof SUPPORTED_NETWORKS]) {
      const supportedList = Object.entries(SUPPORTED_NETWORKS)
        .map(([id, name]) => `${name} (${id})`)
        .join(", ");
      toast.error(
        `Unsupported network. Please switch to one of: ${supportedList}`
      );
    } else {
      const networkName =
        SUPPORTED_NETWORKS[newChainId as keyof typeof SUPPORTED_NETWORKS];
      toast.success(`Connected to ${networkName}`);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, []);

  const reconnectWallet = async () => {
    if (!window.ethereum) return;

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = accounts[0].address;
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setChainId(Number(network.chainId));
        setIsConnected(true);

        // Verify session with backend
        if (sessionToken) {
          await verifySession(address, sessionToken);
        }
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
      await disconnectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = async (skipBackendCall = false): Promise<boolean> => {
    console.log("connectWallet called, USE_MOCK_WALLET:", USE_MOCK_WALLET);

    try {
      setIsConnecting(true);

      if (USE_MOCK_WALLET) {
        console.log("Using mock wallet mode...");

        // Simulate a slight delay for realistic UX
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const address = MOCK_WALLET.address;
        const chainId = MOCK_WALLET.chainId;

        let newSessionToken = null;

        // Only create backend session if not skipping
        if (!skipBackendCall) {
          try {
            console.log("Creating backend session for mock wallet...");
            const sessionResponse = await axios.post(
              `${BACKEND_URL}/api/auth/connect`,
              {
                walletAddress: address,
                chainId: chainId,
                metadata: {
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString(),
                  mockWallet: true,
                },
              }
            );

            newSessionToken = sessionResponse.data.sessionToken;
            console.log("Backend session created for mock wallet successfully");
          } catch (error: any) {
            console.warn(
              "Backend session creation failed for mock wallet:",
              error
            );
            if (error.response?.data?.needsRegistration) {
              console.log("Mock user needs to register first - this is normal");
            } else if (
              error.response?.status === 500 ||
              error.code === "ECONNREFUSED"
            ) {
              console.log(
                "Backend server might be down - continuing with mock wallet"
              );
            } else {
              toast.error(
                "Session creation failed - please try logging in again"
              );
            }
          }
        }

        // Set mock wallet state
        const mockSigner = new MockSigner(address);
        setProvider(null); // Mock mode doesn't have real provider
        setSigner(mockSigner as any); // Use mock signer for testing
        setAccount(address);
        setChainId(chainId);
        setSessionToken(newSessionToken);
        setIsConnected(true);

        if (newSessionToken) {
          updateSession(address, newSessionToken);
        }

        toast.success("Mock wallet connected successfully!");
        console.log("Mock wallet connection completed successfully");
        return true;
      } else {
        console.log(
          "Using real wallet mode, window.ethereum:",
          !!window.ethereum
        );

        if (!window.ethereum) {
          toast.error("Please install MetaMask to continue");
          return false;
        }

        console.log("Starting real wallet connection...");

        // Request account access - this should open MetaMask
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("Account access granted, accounts:", accounts);

        if (!accounts || accounts.length === 0) {
          toast.error("No accounts found. Please connect your wallet.");
          return false;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        console.log(
          "Real wallet connected to address:",
          address,
          "network:",
          network.chainId
        );

        // Verify the address matches what we got from the request
        if (address.toLowerCase() !== accounts[0].toLowerCase()) {
          console.error("Address mismatch:", address, "vs", accounts[0]);
          toast.error("Wallet connection failed - address mismatch");
          return false;
        }

        // Check if we're on a supported network
        const currentChainId = Number(network.chainId);
        if (
          !SUPPORTED_NETWORKS[currentChainId as keyof typeof SUPPORTED_NETWORKS]
        ) {
          const supportedList = Object.entries(SUPPORTED_NETWORKS)
            .map(([id, name]) => `${name} (${id})`)
            .join(", ");
          toast.error(
            `Unsupported network detected. Please manually switch to one of: ${supportedList}`
          );
        }

        let newSessionToken = null;

        // Only create backend session if not skipping
        if (!skipBackendCall) {
          try {
            console.log("Creating backend session...");
            // Create session with backend
            const sessionResponse = await axios.post(
              `${BACKEND_URL}/api/auth/connect`,
              {
                walletAddress: address,
                chainId: Number(network.chainId),
                metadata: {
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString(),
                },
              }
            );

            newSessionToken = sessionResponse.data.sessionToken;
            console.log("Backend session created successfully");
          } catch (error: any) {
            // If backend call fails, just warn but continue with wallet connection
            console.warn("Backend session creation failed:", error);
            if (error.response?.data?.needsRegistration) {
              // This is expected during registration - don't show error
              console.log("User needs to register first - this is normal");
            } else if (
              error.response?.status === 500 ||
              error.code === "ECONNREFUSED"
            ) {
              console.log(
                "Backend server might be down - continuing with wallet connection"
              );
            } else {
              toast.error(
                "Session creation failed - please try logging in again"
              );
            }
          }
        }

        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setChainId(Number(network.chainId));
        setSessionToken(newSessionToken);
        setIsConnected(true);

        // Save session to localStorage only if we have a session token
        if (newSessionToken) {
          updateSession(address, newSessionToken);
        }

        toast.success("Real wallet connected successfully!");
        console.log("Real wallet connection completed successfully");
        return true;
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);

      // Check if user rejected the request
      if (error.code === 4001) {
        toast.error("Wallet connection was rejected by user");
      } else if (error.message?.includes("User rejected")) {
        toast.error("Wallet connection was rejected by user");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to connect wallet"
        );
      }

      await disconnectWallet();
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (sessionToken && account) {
        // Notify backend of logout
        await axios
          .post(`${BACKEND_URL}/api/auth/disconnect`, {
            sessionToken,
          })
          .catch(console.error);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear state
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setSessionToken(null);

    // Clear localStorage
    localStorage.removeItem("festfund_session");

    toast.success("Wallet disconnected");
  };

  const switchChain = async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain doesn't exist, add it
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: "Hardhat Local",
                rpcUrls: [
                  process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC ||
                    "http://localhost:8545",
                ],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          throw addError;
        }
      } else {
        throw error;
      }
    }
  };

  const updateActivity = useCallback(() => {
    if (sessionToken && account) {
      axios
        .post(`${BACKEND_URL}/api/auth/activity`, {
          sessionToken,
        })
        .catch(console.error);
    }
  }, [sessionToken, account]);

  const updateSession = (address: string, token: string | null) => {
    if (token && address) {
      localStorage.setItem(
        "festfund_session",
        JSON.stringify({
          account: address,
          sessionToken: token,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const verifySession = async (address: string, token: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/verify`, {
        sessionToken: token,
        walletAddress: address,
      });
    } catch (error) {
      // Don't disconnect wallet on session verification failure
      // This allows users to connect wallet for registration
      console.log("Session verification failed - this is normal for new users");
      // Just clear the invalid session token
      setSessionToken(null);
      localStorage.removeItem("festfund_session");
    }
  };

  const value = {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    chainId,
    sessionToken,
    connectWallet,
    disconnectWallet,
    switchChain,
    updateActivity,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
