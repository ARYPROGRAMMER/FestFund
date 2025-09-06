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

  const handleGenerateCommitment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid donation amount");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess(null);
    setStep("commitment");

    try {
      // Get user's wallet address
      const accounts = await (window as any).ethereum?.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("Please connect your wallet first");
      }

      console.log(`🔒 Generating ${zkConfig.mode} ZK proof for donation...`);

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
            zkMode: zkConfig.mode, // Pass the ZK mode to backend
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate ZK commitment");
      }

      setCommitment(result);
      setStep("payment");

      if (onCommitmentGenerated) {
        onCommitmentGenerated(result);
      }
    } catch (err: any) {
      console.error("ZK commitment generation failed:", err);
      setError(err.message || "Failed to generate commitment");
      setStep("amount");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePayment = async () => {
    if (!commitment || !organizerAddress) {
      setError("Missing payment information");
      return;
    }

    setIsProcessingPayment(true);
    setError("");

    try {
      // Initialize Web3 provider
      const provider = new (window as any).ethers.providers.Web3Provider(
        (window as any).ethereum
      );
      const signer = provider.getSigner();

      // Convert amount from ETH to Wei
      const amountWei = (window as any).ethers.utils.parseEther(amount);

      console.log(
        `💸 Processing payment of ${amount} ETH to ${organizerAddress}`
      );

      // Send transaction
      const tx = await signer.sendTransaction({
        to: organizerAddress,
        value: amountWei,
        gasLimit: 21000, // Standard gas limit for ETH transfer
      });

      console.log(`📝 Transaction sent: ${tx.hash}`);
      setPaymentTxHash(tx.hash);

      // Wait for confirmation
      await tx.wait();

      console.log(`✅ Payment confirmed: ${tx.hash}`);

      // Update success state
      setSuccess({
        commitmentId: commitment.commitmentId,
        commitment: commitment.commitment,
        txHash: tx.hash,
      });

      setStep("complete");

      if (onPaymentComplete) {
        onPaymentComplete(tx.hash, amount);
      }

      if (onCommitmentSubmit) {
        await onCommitmentSubmit(
          amount,
          commitment.nonce,
          commitment.commitment
        );
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(`Payment failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderStepContent = () => {
    switch (step) {
      case "amount":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Donation Amount (ETH)
              </label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                disabled={isGenerating || isLoading}
                className="bg-white dark:bg-slate-700"
              />
              {targetAmount && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Target: {targetAmount} ETH | Current: {currentAmount || 0} ETH
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Zero-Knowledge Privacy</AlertTitle>
              <AlertDescription>
                {zkConfig.isMidnightNetwork
                  ? `This will generate a real zero-knowledge commitment using the official Midnight Network testnet-02. Your donation amount and identity remain completely private while being cryptographically verifiable. Expected generation time: ${zkInfo.performance}.`
                  : `This will generate a real zero-knowledge proof using self-hosted infrastructure. Your donation amount and identity remain completely private while being cryptographically verifiable. Expected generation time: ${zkInfo.performance}.`}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerateCommitment}
              disabled={isGenerating || isLoading || !amount}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating {zkConfig.isMidnightNetwork
                    ? "Midnight"
                    : "ZK"}{" "}
                  Proof...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Generate Anonymous Commitment
                </>
              )}
            </Button>
          </div>
        );

      case "commitment":
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h3 className="text-lg font-medium mb-2">Generating ZK Proof</h3>
            <p className="text-slate-600">This may take a few moments...</p>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>ZK Commitment Generated!</AlertTitle>
              <AlertDescription>
                Your private commitment has been generated. Now proceed with the
                payment to complete your donation.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{amount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Recipient:</span>
                  <span className="font-mono text-xs">
                    {organizerAddress?.slice(0, 10)}...
                    {organizerAddress?.slice(-8)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Send Payment
                </>
              )}
            </Button>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2 text-green-700">
              Donation Complete!
            </h3>
            <p className="text-slate-600 mb-4">
              Your anonymous donation has been processed successfully.
            </p>

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Transaction Hash:</span>
                  <button
                    onClick={() => copyToClipboard(success.txHash)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    {success.txHash.slice(0, 10)}...{success.txHash.slice(-8)}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>

                <a
                  href={getTransactionUrl(success.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <Button
              onClick={() => {
                setStep("amount");
                setAmount("");
                setCommitment(null);
                setSuccess(null);
                setError("");
              }}
              className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Make Another Donation
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Shield className="w-5 h-5" />
          Make Private Donation
          <Badge
            variant={zkConfig.isMidnightNetwork ? "secondary" : "outline"}
            className="ml-auto"
          >
            {zkInfo.icon} {zkInfo.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}
      </CardContent>
    </Card>
  );
};
