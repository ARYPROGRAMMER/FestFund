import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useWallet } from "../contexts/WalletContext";
import {
  Plus,
  Minus,
  Target,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Shield,
  CheckCircle,
} from "lucide-react";

const CreateCampaignPage: React.FC = () => {
  const router = useRouter();
  const { account, isConnected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    endDate: "",
    category: "technology",
    milestones: [{ amount: "", description: "" }],
    privacyLevel: "high",
    allowAnonymous: true,
    requireVerification: false,
    tags: "",
  });

  const categories = [
    "technology",
    "healthcare",
    "education",
    "environment",
    "community",
    "arts",
    "sports",
    "charity",
    "business",
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { amount: "", description: "" }],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      ),
    }));
  };

  const handleSubmit = async () => {
    console.log("🚀 Create Campaign button clicked");
    console.log("📝 Form data:", formData);
    console.log("🔗 Wallet connected:", isConnected);
    console.log("👤 Account:", account);

    if (!isConnected || !account) {
      console.error("❌ Wallet not connected");
      alert("Please connect your wallet first");
      return;
    }

    console.log("✅ Starting campaign creation...");
    setIsSubmitting(true);

    try {
      const milestones = formData.milestones
        .filter((m) => m.amount && parseFloat(m.amount) > 0)
        .map((m) => parseFloat(m.amount))
        .sort((a, b) => a - b);

      const campaignData = {
        name: formData.name,
        description: formData.description,
        targetAmount: parseFloat(formData.targetAmount),
        organizer: account,
        organizerAddress: account,
        endDate: formData.endDate,
        category: formData.category,
        milestones: milestones,
        metadata: {
          privacyLevel: formData.privacyLevel,
          allowAnonymous: formData.allowAnonymous,
          requireVerification: formData.requireVerification,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          createdBy: account,
          timestamp: new Date().toISOString(),
        },
      };

      console.log("📦 Campaign data to send:", campaignData);

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      console.log("🌐 Backend URL:", backendUrl);

      const response = await fetch(`${backendUrl}/api/proof/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Campaign created successfully:", result);
        alert("Campaign created successfully!");
        router.push(`/events/${result.eventId}`);
      } else {
        const error = await response.json();
        console.error("❌ Server error:", error);
        alert(`Failed to create campaign: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("💥 Error creating campaign:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Campaign creation finished");
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Basic Information validation
        if (!formData.name.trim()) return false;
        if (formData.name.trim().length < 3) return false;
        if (formData.name.trim().length > 100) return false;
        if (!formData.description.trim()) return false;
        if (formData.description.trim().length < 10) return false;
        if (formData.description.trim().length > 2000) return false;
        if (!formData.category) return false;
        return true;

      case 2: {
        // Funding Details validation
        if (!formData.targetAmount) return false;
        const targetAmount = parseFloat(formData.targetAmount);
        if (isNaN(targetAmount) || targetAmount <= 0) return false;
        if (targetAmount > 1000) return false; // Max 1000 ETH
        if (!formData.endDate) return false;
        const endDate = new Date(formData.endDate);
        const now = new Date();
        if (endDate <= now) return false;
        // Max 365 days from now
        const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        if (endDate > maxDate) return false;
        return true;
      }

      case 3: {
        // Milestones validation
        const validMilestones = formData.milestones.filter((m) => {
          if (!m.amount || !m.description.trim()) return false;
          const amount = parseFloat(m.amount);
          if (isNaN(amount) || amount <= 0) return false;
          return m.description.trim().length >= 5;
        });
        if (validMilestones.length === 0) return false;

        // Check if milestone amounts are reasonable
        const targetAmountValue = parseFloat(formData.targetAmount);
        if (targetAmountValue > 0) {
          const totalMilestoneAmount = validMilestones.reduce(
            (sum, m) => sum + parseFloat(m.amount),
            0
          );
          if (totalMilestoneAmount > targetAmountValue) return false;
        }
        return true;
      }

      case 4:
        // Final validation - all previous steps must be valid
        return validateStep(1) && validateStep(2) && validateStep(3);

      default:
        return true;
    }
  };

  const getValidationError = (step: number): string => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) return "Campaign name is required";
        if (formData.name.trim().length < 3)
          return "Campaign name must be at least 3 characters";
        if (formData.name.trim().length > 100)
          return "Campaign name must be less than 100 characters";
        if (!formData.description.trim()) return "Description is required";
        if (formData.description.trim().length < 10)
          return "Description must be at least 10 characters";
        if (formData.description.trim().length > 2000)
          return "Description must be less than 2000 characters";
        return "";

      case 2: {
        if (!formData.targetAmount) return "Target amount is required";
        const targetAmount = parseFloat(formData.targetAmount);
        if (isNaN(targetAmount) || targetAmount <= 0)
          return "Target amount must be a positive number";
        if (targetAmount > 1000) return "Target amount cannot exceed 1000 ETH";
        if (!formData.endDate) return "End date is required";
        const endDate = new Date(formData.endDate);
        const now = new Date();
        if (endDate <= now) return "End date must be in the future";
        const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        if (endDate > maxDate)
          return "End date cannot be more than 1 year from now";
        return "";
      }

      case 3: {
        const validMilestones = formData.milestones.filter((m) => {
          if (!m.amount || !m.description.trim()) return false;
          const amount = parseFloat(m.amount);
          return (
            !isNaN(amount) && amount > 0 && m.description.trim().length >= 5
          );
        });
        if (validMilestones.length === 0)
          return "At least one valid milestone is required";
        const targetAmountCheck = parseFloat(formData.targetAmount);
        if (targetAmountCheck > 0) {
          const totalMilestoneAmount = validMilestones.reduce(
            (sum, m) => sum + parseFloat(m.amount),
            0
          );
          if (totalMilestoneAmount > targetAmountCheck)
            return "Total milestone amounts cannot exceed target amount";
        }
        return "";
      }

      default:
        return "";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 mb-6">
            You need to connect your wallet to create a campaign
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
            Create Campaign
          </h1>
          <p className="text-gray-400 text-lg">
            Launch your privacy-preserving fundraising campaign
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      currentStep > step ? "bg-purple-600" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-400 max-w-2xl mx-auto px-5">
            <span>Basic Info</span>
            <span>Funding</span>
            <span>Milestones</span>
            <span>Review</span>
          </div>
        </div>

        <Card className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              {currentStep === 1 && (
                <>
                  <FileText className="w-5 h-5" /> Basic Information
                </>
              )}
              {currentStep === 2 && (
                <>
                  <DollarSign className="w-5 h-5" /> Funding Details
                </>
              )}
              {currentStep === 3 && (
                <>
                  <Target className="w-5 h-5" /> Milestones
                </>
              )}
              {currentStep === 4 && (
                <>
                  <Settings className="w-5 h-5" /> Review & Create
                </>
              )}
            </CardTitle>
            {!validateStep(currentStep) && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-600 rounded-lg">
                <p className="text-red-300 text-sm">
                  {getValidationError(currentStep)}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Name *{" "}
                    <span className="text-gray-500">
                      ({formData.name.length}/100)
                    </span>
                  </label>
                  <Input
                    placeholder="Enter campaign name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("name", e.target.value)
                    }
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 ${
                      formData.name.length > 100 ? "border-red-500" : ""
                    }`}
                    style={{ color: "#ffffff", backgroundColor: "#1f2937" }}
                    maxLength={100}
                  />
                  {formData.name.length > 100 && (
                    <p className="text-red-400 text-sm mt-1">
                      Campaign name is too long
                    </p>
                  )}
                  {formData.name.length > 0 && formData.name.length < 3 && (
                    <p className="text-yellow-400 text-sm mt-1">
                      Campaign name must be at least 3 characters
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *{" "}
                    <span className="text-gray-500">
                      ({formData.description.length}/2000)
                    </span>
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 min-h-[100px] ${
                      formData.description.length > 2000 ? "border-red-500" : ""
                    }`}
                    rows={4}
                    placeholder="Describe your campaign..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    maxLength={2000}
                    style={{ color: "#ffffff", backgroundColor: "#1f2937" }}
                  />
                  {formData.description.length > 2000 && (
                    <p className="text-red-400 text-sm mt-1">
                      Description is too long
                    </p>
                  )}
                  {formData.description.length > 0 &&
                    formData.description.length < 10 && (
                      <p className="text-yellow-400 text-sm mt-1">
                        Description must be at least 10 characters
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-purple-500 focus:ring-purple-500"
                    style={{ color: "#ffffff", backgroundColor: "#1f2937" }}
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                        style={{ color: "#ffffff", backgroundColor: "#1f2937" }}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="blockchain, privacy, fundraising"
                    value={formData.tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("tags", e.target.value)
                    }
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    style={{ color: "#ffffff", backgroundColor: "#1f2937" }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Funding Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Amount (ETH) *{" "}
                    <span className="text-gray-500">(Max: 1000 ETH)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="1000"
                    placeholder="0.000"
                    value={formData.targetAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("targetAmount", e.target.value)
                    }
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 ${
                      formData.targetAmount &&
                      (parseFloat(formData.targetAmount) <= 0 ||
                        parseFloat(formData.targetAmount) > 1000)
                        ? "border-red-500"
                        : ""
                    }`}
                    style={{ color: "#ffffff", backgroundColor: "#1f2937" }}
                  />
                  {formData.targetAmount &&
                    parseFloat(formData.targetAmount) > 1000 && (
                      <p className="text-red-400 text-sm mt-1">
                        Target amount cannot exceed 1000 ETH
                      </p>
                    )}
                  {formData.targetAmount &&
                    parseFloat(formData.targetAmount) <= 0 && (
                      <p className="text-red-400 text-sm mt-1">
                        Target amount must be greater than 0
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date *{" "}
                    <span className="text-gray-500">
                      (Max: 1 year from now)
                    </span>
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    max={
                      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0]
                    }
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    style={{
                      colorScheme: "dark",
                      color: "#ffffff",
                      backgroundColor: "#1f2937",
                    }}
                  />
                  {formData.endDate &&
                    new Date(formData.endDate) <= new Date() && (
                      <p className="text-red-400 text-sm mt-1">
                        End date must be in the future
                      </p>
                    )}
                  {formData.endDate &&
                    new Date(formData.endDate) >
                      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) && (
                      <p className="text-yellow-400 text-sm mt-1">
                        End date is more than 1 year from now
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Privacy Level
                  </label>
                  <select
                    value={formData.privacyLevel}
                    onChange={(e) =>
                      handleInputChange("privacyLevel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="high">High - Maximum anonymity</option>
                    <option value="medium">Medium - Partial privacy</option>
                    <option value="low">Low - Minimal privacy</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowAnonymous"
                      checked={formData.allowAnonymous}
                      onChange={(e) =>
                        handleInputChange(
                          "allowAnonymous",
                          e.target.checked.toString()
                        )
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="allowAnonymous"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Allow anonymous donations
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireVerification"
                      checked={formData.requireVerification}
                      onChange={(e) =>
                        handleInputChange(
                          "requireVerification",
                          e.target.checked.toString()
                        )
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="requireVerification"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Require donor verification
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Milestones */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Funding Milestones
                  </h3>
                  <Button onClick={addMilestone} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Amount (ETH)"
                          value={milestone.amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateMilestone(index, "amount", e.target.value)
                          }
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                          style={{
                            color: "#ffffff",
                            backgroundColor: "#1f2937",
                          }}
                        />
                      </div>
                      <div className="flex-2">
                        <Input
                          placeholder="Milestone description"
                          value={milestone.description}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateMilestone(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                          style={{
                            color: "#ffffff",
                            backgroundColor: "#1f2937",
                          }}
                        />
                      </div>
                      {formData.milestones.length > 1 && (
                        <Button
                          onClick={() => removeMilestone(index)}
                          size="sm"
                          variant="outline"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    💡 Milestones help donors track progress and unlock
                    achievements
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Campaign Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Name:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.name}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Category:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.category}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Target:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.targetAmount} ETH
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        End Date:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.endDate}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Privacy Level:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.privacyLevel}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Milestones:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.milestones.filter((m) => m.amount).length}{" "}
                        configured
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Description:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formData.description}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Ready to Launch
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your campaign will be created with zero-knowledge
                        privacy features enabled. Donors will be able to
                        contribute anonymously while progress remains
                        transparent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!validateStep(currentStep)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Campaign"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
