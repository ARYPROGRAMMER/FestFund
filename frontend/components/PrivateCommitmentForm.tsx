import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Shield,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  ExternalLink,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { getZKConfig, getZKModeInfo, getTransactionUrl } from "../lib/zkConfig";

interface RealCommitmentFormProps {
  eventId: string;
  eventName: string;
  milestones?: number[];
  currentMilestone?: number;
  targetAmount?: number;
  currentAmount?: number;
  organizerAddress?: string;
  onCommitmentSubmit?: (
    amount: string,
    nonce: string,
    commitmentHash: string
  ) => Promise<void>;
  onCommitmentGenerated?: (commitment: any) => void;
  onPaymentComplete?: (txHash: string, amount: string) => void;
  onBackToEvent?: () => void;
  isLoading?: boolean;
}

export const PrivateCommitmentForm: React.FC<RealCommitmentFormProps> = ({
  eventId,
  eventName,
  milestones,
  currentMilestone,
  targetAmount,
  currentAmount,
  organizerAddress,
  onCommitmentSubmit,
  onCommitmentGenerated,
  onPaymentComplete,
  onBackToEvent,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<
    "amount" | "commitment" | "payment" | "complete"
  >("amount");
  const [commitment, setCommitment] = useState<any>(null);
  const [paymentTxHash, setPaymentTxHash] = useState("");
  const [success, setSuccess] = useState<{
    commitmentId: string;
    commitment: string;
    txHash: string;
  } | null>(null);

  const zkConfig = getZKConfig();
  const zkInfo = getZKModeInfo(zkConfig);

  // Debug logging
  console.log("🔧 ZK Config Debug:", {
    mode: zkConfig.mode,
    isMidnightNetwork: zkConfig.isMidnightNetwork,
    isOwnKeys: zkConfig.isOwnKeys,
    networkName: zkConfig.networkName,
    icon: zkInfo.icon,
    name: zkInfo.name,
  });

  console.log("🎯 Badge Display Values:", {
    badgeIcon: zkInfo.icon,
    badgeName: zkInfo.name,
    isMidnightNetwork: zkConfig.isMidnightNetwork,
    shouldShowMoon: zkConfig.isMidnightNetwork ? "YES (🌙)" : "NO (🔑)"
  });

  const handleGenerateCommitment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid donation amount");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess(null);
    setStep("payment"); // Go to payment first

    try {
      // Get user's wallet address
      const accounts = await (window as any).ethereum?.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("Please connect your wallet first");
      }

      console.log(`� Proceeding to payment for ${amount} ETH donation...`);
      // Payment will be handled in the next step
    } catch (err: any) {
      console.error("Preparation failed:", err);
      setError(err.message || "Failed to prepare donation");
      setStep("amount");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePayment = async () => {
    if (!organizerAddress) {
      setError("Missing payment information");
      return;
    }

    setIsProcessingPayment(true);
    setError("");

    try {
      const useMockWallet = process.env.NEXT_PUBLIC_USE_MOCK_WALLET === "true";
      let txHash: string;

      if (useMockWallet) {
        // Mock payment for testing with hardhat
        console.log(`💰 Mock payment: ${amount} ETH to ${organizerAddress}`);

        // Simulate payment delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Generate mock transaction hash
        txHash = "0x" + Math.random().toString(16).substr(2, 64);
        console.log(`📝 Mock transaction: ${txHash}`);
      } else {
        // Real wallet payment
        console.log(`💸 Real payment: ${amount} ETH to ${organizerAddress}`);

        // Check if ethereum is available
        if (!(window as any).ethereum) {
          throw new Error("Please connect your wallet first");
        }

        // Initialize Web3 provider - handle both ethers v5 and v6
        let provider, signer, amountWei;

        if ((window as any).ethers) {
          // Try ethers v6 first
          if ((window as any).ethers.BrowserProvider) {
            provider = new (window as any).ethers.BrowserProvider(
              (window as any).ethereum
            );
            signer = await provider.getSigner();
            amountWei = (window as any).ethers.parseEther(amount);
          }
          // Fallback to ethers v5
          else if ((window as any).ethers.providers) {
            provider = new (window as any).ethers.providers.Web3Provider(
              (window as any).ethereum
            );
            signer = provider.getSigner();
            amountWei = (window as any).ethers.utils.parseEther(amount);
          } else {
            throw new Error("Ethers library not properly loaded");
          }
        } else {
          throw new Error("Ethers library not found. Please refresh the page.");
        }

        // Send transaction
        const tx = await signer.sendTransaction({
          to: organizerAddress,
          value: amountWei,
          gasLimit: 21000,
        });

        console.log(`📝 Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        await tx.wait();
        txHash = tx.hash;
      }

      setPaymentTxHash(txHash);
      console.log(`✅ Payment confirmed: ${txHash}`);

      // Now generate ZK commitment after successful payment
      setStep("commitment");
      await generateCommitmentAfterPayment(txHash);
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(`Payment failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const generateCommitmentAfterPayment = async (paymentTxHash: string) => {
    try {
      console.log(
        `🔒 Generating ${zkConfig.mode} ZK commitment after successful payment...`
      );

      // Get user's wallet address
      const accounts = await (window as any).ethereum?.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("Wallet not connected");
      }

      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

      const response = await fetch(
        `${BACKEND_URL}/api/proof/generate-commitment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            amount: amount,
            eventId: eventId,
            donorAddress: accounts[0],
            zkMode: zkConfig.mode,
            paymentTxHash: paymentTxHash, // Include payment transaction hash
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate ZK commitment");
      }

      setCommitment(result);
      setSuccess({
        commitmentId: result.commitmentId,
        commitment: result.commitment,
        txHash: paymentTxHash,
      });
      setStep("complete");

      if (onCommitmentGenerated) {
        onCommitmentGenerated(result);
      }

      if (onPaymentComplete) {
        onPaymentComplete(paymentTxHash, amount);
      }

      if (onCommitmentSubmit) {
        await onCommitmentSubmit(amount, result.nonce, result.commitment);
      }
    } catch (err: any) {
      console.error("ZK commitment generation failed:", err);
      setError(`Commitment generation failed: ${err.message}`);
      setStep("payment"); // Go back to payment step
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderStepContent = () => {
    switch (step) {
      case "amount":
        return (
          <div className="space-y-6">
            {/* Amount Input Section */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-white mb-3">
                Donation Amount (ETH)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.001"
                  disabled={isGenerating || isLoading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-lg h-14 pr-16 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                  ETH
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0.01, 0.05, 0.1, 0.5].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white"
                  >
                    {quickAmount} ETH
                  </Button>
                ))}
              </div>
            </div>

            {/* Privacy Info Alert */}
            <Alert className="bg-blue-900/20 border-blue-700 text-blue-100">
              <Shield className="h-5 w-5" />
              <AlertTitle className="text-blue-200">
                Zero-Knowledge Privacy Protection
              </AlertTitle>
              <AlertDescription className="text-blue-100 leading-relaxed">
                {zkConfig.isMidnightNetwork
                  ? `Your donation will be processed through the official Midnight Network testnet-02. Your identity and donation amount remain completely private while being cryptographically verifiable. Generation time: ${zkInfo.performance}.`
                  : `Your donation will be processed using self-hosted zero-knowledge infrastructure. Your identity and donation amount remain completely private while being cryptographically verifiable. Generation time: ${zkInfo.performance}.`}
              </AlertDescription>
            </Alert>

            {/* Action Button */}
            <Button
              onClick={handleGenerateCommitment}
              disabled={
                isGenerating || isLoading || !amount || Number(amount) <= 0
              }
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Preparing Secure Payment...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-3" />
                  Generate Anonymous Commitment
                </>
              )}
            </Button>
          </div>
        );

      case "commitment":
        return (
          <div className="text-center py-12">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 animate-ping"></div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Generating Zero-Knowledge Proof
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
              Creating your cryptographic commitment to ensure complete privacy
              while maintaining verifiability.
            </p>

            <div className="mt-8 bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-center gap-3 text-blue-400">
                <Lock className="w-5 h-5" />
                <span className="font-medium">
                  Your donation amount remains completely private
                </span>
              </div>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            {/* Success Alert */}
            <Alert className="bg-green-900/20 border-green-700 text-green-100">
              <CheckCircle className="h-5 w-5" />
              <AlertTitle className="text-green-200">
                Zero-Knowledge Commitment Generated!
              </AlertTitle>
              <AlertDescription className="text-green-100">
                Your private commitment has been successfully created. Now
                complete your donation by sending the payment.
              </AlertDescription>
            </Alert>

            {/* Payment Details Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                Payment Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <div className="text-sm text-blue-300 mb-2">
                    Donation Amount
                  </div>
                  <div className="text-2xl font-bold text-blue-100">
                    {amount} ETH
                  </div>
                </div>

                <div className="bg-purple-900/30 rounded-lg p-4">
                  <div className="text-sm text-purple-300 mb-2">
                    Recipient Address
                  </div>
                  <div className="text-sm font-mono text-purple-100 break-all">
                    {organizerAddress?.slice(0, 20)}...
                    {organizerAddress?.slice(-10)}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-200 font-medium mb-1">
                      Secure Transaction
                    </p>
                    <p className="text-yellow-100 text-sm leading-relaxed">
                      This payment will be sent directly to the campaign
                      organizer via your connected wallet. Your privacy is
                      protected through the zero-knowledge commitment system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-3" />
                  Send Payment ({amount} ETH)
                </>
              )}
            </Button>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-8">
            {/* Success Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-20 animate-ping"></div>
            </div>

            <h3 className="text-3xl font-bold text-green-400 mb-4">
              Donation Complete!
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto mb-8">
              Your anonymous donation has been successfully processed and
              recorded on the blockchain.
            </p>

            {/* Transaction Details */}
            {success && (
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-semibold text-green-200 mb-4">
                  Transaction Details
                </h4>

                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Transaction Hash:</span>
                      <button
                        onClick={() => copyToClipboard(success.txHash)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm bg-gray-700/50 px-3 py-1 rounded"
                      >
                        {success.txHash.slice(0, 10)}...
                        {success.txHash.slice(-8)}
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <a
                    href={getTransactionUrl(success.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Blockchain Explorer
                  </a>
                </div>
              </div>
            )}

            {/* Privacy Confirmation */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-400" />
                <h4 className="text-lg font-semibold text-blue-200">
                  Privacy Protected
                </h4>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Your donation amount and identity remain completely private
                while contributing to campaign transparency.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  setStep("amount");
                  setAmount("");
                  setCommitment(null);
                  setSuccess(null);
                  setError("");
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                Make Another Donation
              </Button>

              <Button
                variant="outline"
                onClick={() => (window.location.href = `/events/${eventId}`)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-8 py-3"
              >
                Back to Campaign
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* Back Button */}
          {onBackToEvent && (
            <div className="flex justify-start mb-6">
              <Button
                variant="ghost"
                onClick={onBackToEvent}
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Button>
            </div>
          )}

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full mb-6">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-100">
              Zero-Knowledge Privacy Enabled
            </span>
            <Badge
              variant={zkConfig.isMidnightNetwork ? "secondary" : "outline"}
              className="bg-blue-800/50 text-blue-200 border-blue-600/50"
            >
              {zkInfo.icon} {zkInfo.name}
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-4">
            Contribute to {eventName}
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Support this campaign with complete donation privacy through{" "}
            <span className="font-semibold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
              zero-knowledge proofs
            </span>
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              Private Donation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Campaign Info Section */}
            {targetAmount && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Campaign Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-900/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {currentAmount || 0} ETH
                    </div>
                    <div className="text-sm text-blue-200">Current Amount</div>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-400">
                      {targetAmount} ETH
                    </div>
                    <div className="text-sm text-purple-200">Target Amount</div>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {targetAmount > 0
                        ? Math.round(
                            ((currentAmount || 0) / targetAmount) * 100
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-green-200">Progress</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-900/20 border-red-800 text-red-200"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Content */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
              {renderStepContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
