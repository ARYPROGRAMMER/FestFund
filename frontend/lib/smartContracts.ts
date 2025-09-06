/**
 * Smart Contract Integration Service
 * Handles interaction with FundManager and Verifier contracts
 */

import React from 'react';
import { ethers } from 'ethers';

// Contract addresses (these should be set from deployment)
const CONTRACT_ADDRESSES = {
  FUND_MANAGER: process.env.NEXT_PUBLIC_FUND_MANAGER_ADDRESS || '0x...',
  VERIFIER: process.env.NEXT_PUBLIC_VERIFIER_ADDRESS || '0x...',
  MOCK_ERC20: process.env.NEXT_PUBLIC_MOCK_ERC20_ADDRESS || '0x...',
};

// Contract ABIs (simplified - in production, import from artifacts)
const FUND_MANAGER_ABI = [
  "function createEvent(string name, string description, uint256[] milestones) external returns (uint256)",
  "function makeCommitment(uint256 eventId, bytes32 commitmentHash) external",
  "function verifyMilestone(uint256 eventId, uint256[8] proof, uint256[] publicInputs) external",
  "function events(uint256) external view returns (string, string, address, uint256[], uint256, uint256, bool, uint256)",
  "function eventCommitments(uint256, uint256) external view returns (bytes32, address, uint256, uint256, bool)",
  "function getEventCommitments(uint256 eventId) external view returns (tuple(bytes32,address,uint256,uint256,bool)[])",
  "event EventCreated(uint256 indexed eventId, string name, address organizer)",
  "event CommitmentMade(uint256 indexed eventId, bytes32 commitmentHash, address donor)",
  "event MilestoneProven(uint256 indexed eventId, uint256 milestone, uint256 topKSum)"
];

const VERIFIER_ABI = [
  "function verifyProof(uint256[8] proof, uint256[] publicInputs) external view returns (bool)",
  "function getVerificationKey() external view returns (uint256[14])"
];

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export class SmartContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private fundManagerContract: ethers.Contract | null = null;
  private verifierContract: ethers.Contract | null = null;
  private mockTokenContract: ethers.Contract | null = null;

  async initialize(provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) {
    this.provider = provider;
    this.signer = signer;

    try {
      // Initialize contracts
      this.fundManagerContract = new ethers.Contract(
        CONTRACT_ADDRESSES.FUND_MANAGER,
        FUND_MANAGER_ABI,
        signer
      );

      this.verifierContract = new ethers.Contract(
        CONTRACT_ADDRESSES.VERIFIER,
        VERIFIER_ABI,
        signer
      );

      this.mockTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MOCK_ERC20,
        ERC20_ABI,
        signer
      );

      console.log('✅ Smart contracts initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize smart contracts:', error);
      return false;
    }
  }

  // Campaign Management
  async createCampaignOnChain(campaignData: {
    name: string;
    description: string;
    milestones: number[];
  }) {
    if (!this.fundManagerContract) {
      throw new Error('Smart contracts not initialized');
    }

    try {
      console.log('📝 Creating campaign on-chain...');
      
      // Convert milestones to wei
      const milestonesWei = campaignData.milestones.map(m => 
        ethers.parseEther(m.toString())
      );

      const tx = await this.fundManagerContract.createEvent(
        campaignData.name,
        campaignData.description,
        milestonesWei
      );

      console.log('📤 Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      // Extract event ID from logs
      const eventLogs = receipt.logs.filter((log: any) => {
        try {
          return this.fundManagerContract?.interface.parseLog(log)?.name === 'EventCreated';
        } catch {
          return false;
        }
      });

      if (eventLogs.length > 0) {
        const parsedLog = this.fundManagerContract.interface.parseLog(eventLogs[0]);
        const eventId = parsedLog?.args[0].toString();
        
        console.log('✅ Campaign created on-chain with ID:', eventId);
        return {
          success: true,
          eventId: eventId,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        };
      } else {
        throw new Error('Event creation log not found');
      }
    } catch (error: any) {
      console.error('❌ Failed to create campaign on-chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async makeCommitmentOnChain(eventId: string, commitmentHash: string) {
    if (!this.fundManagerContract) {
      throw new Error('Smart contracts not initialized');
    }

    try {
      console.log('🔒 Making commitment on-chain...');
      
      const tx = await this.fundManagerContract.makeCommitment(
        eventId,
        commitmentHash
      );

      console.log('📤 Commitment transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ Commitment made on-chain');
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error: any) {
      console.error('❌ Failed to make commitment on-chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyMilestoneOnChain(eventId: string, proof: number[], publicInputs: number[]) {
    if (!this.fundManagerContract) {
      throw new Error('Smart contracts not initialized');
    }

    try {
      console.log('🏆 Verifying milestone on-chain...');
      
      const tx = await this.fundManagerContract.verifyMilestone(
        eventId,
        proof,
        publicInputs
      );

      console.log('📤 Milestone verification sent:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ Milestone verified on-chain');
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error: any) {
      console.error('❌ Failed to verify milestone on-chain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Data Retrieval
  async getEventFromChain(eventId: string) {
    if (!this.fundManagerContract) {
      throw new Error('Smart contracts not initialized');
    }

    try {
      const eventData = await this.fundManagerContract.events(eventId);
      
      return {
        name: eventData[0],
        description: eventData[1],
        organizer: eventData[2],
        milestones: eventData[3].map((m: bigint) => ethers.formatEther(m)),
        totalCommitted: ethers.formatEther(eventData[4]),
        currentMilestone: eventData[5].toString(),
        isActive: eventData[6],
        createdAt: new Date(Number(eventData[7]) * 1000).toISOString()
      };
    } catch (error: any) {
      console.error('❌ Failed to get event from chain:', error);
      throw error;
    }
  }

  async getEventCommitmentsFromChain(eventId: string) {
    if (!this.fundManagerContract) {
      throw new Error('Smart contracts not initialized');
    }

    try {
      const commitments = await this.fundManagerContract.getEventCommitments(eventId);
      
      return commitments.map((commitment: any) => ({
        commitmentHash: commitment[0],
        donor: commitment[1],
        eventId: commitment[2].toString(),
        timestamp: new Date(Number(commitment[3]) * 1000).toISOString(),
        isRevealed: commitment[4]
      }));
    } catch (error: any) {
      console.error('❌ Failed to get commitments from chain:', error);
      throw error;
    }
  }

  // ZK Proof Verification
  async verifyProofOnChain(proof: number[], publicInputs: number[]) {
    if (!this.verifierContract) {
      throw new Error('Verifier contract not initialized');
    }

    try {
      const isValid = await this.verifierContract.verifyProof(proof, publicInputs);
      return isValid;
    } catch (error: any) {
      console.error('❌ Failed to verify proof on-chain:', error);
      throw error;
    }
  }

  // Token Operations (for testing with MockERC20)
  async getTokenBalance(address: string) {
    if (!this.mockTokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const balance = await this.mockTokenContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.error('❌ Failed to get token balance:', error);
      throw error;
    }
  }

  async transferTokens(to: string, amount: string) {
    if (!this.mockTokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await this.mockTokenContract.transfer(to, amountWei);
      
      console.log('📤 Token transfer sent:', tx.hash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error: any) {
      console.error('❌ Failed to transfer tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Event Listeners
  async listenForEvents(eventId: string, callback: (event: any) => void) {
    if (!this.fundManagerContract) {
      throw new Error('Smart contracts not initialized');
    }

    try {
      // Listen for commitment events
      this.fundManagerContract.on('CommitmentMade', (eventIdFromEvent, commitmentHash, donor) => {
        if (eventIdFromEvent.toString() === eventId) {
          callback({
            type: 'CommitmentMade',
            eventId: eventIdFromEvent.toString(),
            commitmentHash,
            donor
          });
        }
      });

      // Listen for milestone events
      this.fundManagerContract.on('MilestoneProven', (eventIdFromEvent, milestone, topKSum) => {
        if (eventIdFromEvent.toString() === eventId) {
          callback({
            type: 'MilestoneProven',
            eventId: eventIdFromEvent.toString(),
            milestone: milestone.toString(),
            topKSum: ethers.formatEther(topKSum)
          });
        }
      });

      console.log('👂 Listening for events on eventId:', eventId);
    } catch (error: any) {
      console.error('❌ Failed to set up event listeners:', error);
    }
  }

  async stopListening() {
    if (this.fundManagerContract) {
      this.fundManagerContract.removeAllListeners();
      console.log('🔇 Stopped listening for events');
    }
  }

  // Utility Methods
  isInitialized() {
    return !!(this.fundManagerContract && this.verifierContract);
  }

  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }
}

// Singleton instance
export const smartContractService = new SmartContractService();

// React Hook for Smart Contract Integration
export const useSmartContracts = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialize = async (provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => {
    try {
      const success = await smartContractService.initialize(provider, signer);
      setIsInitialized(success);
      if (!success) {
        setError('Failed to initialize smart contracts');
      }
    } catch (err: any) {
      setError(err.message);
      setIsInitialized(false);
    }
  };

  return {
    isInitialized,
    error,
    initialize,
    smartContractService
  };
};

export default smartContractService;
