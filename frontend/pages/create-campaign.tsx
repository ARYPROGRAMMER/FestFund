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
  FileText,
  DollarSign,
  Settings,
  Shield,
  CheckCircle,
  Loader2,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
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

  const handleInputChange = (field: string, value: string | boolean) => {
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
      // Validate all steps before submission
      for (let step = 1; step <= 4; step++) {
        if (!validateStep(step)) {
          const errorMessage = getValidationError(step);
          console.error(`❌ Validation failed at step ${step}:`, errorMessage);
          alert(`Validation error: ${errorMessage}`);
          setCurrentStep(step);
          return;
        }
      }

      const milestones = formData.milestones
        .filter((m) => m.amount && parseFloat(m.amount) > 0)
        .map((m) => parseFloat(m.amount))
        .sort((a, b) => a - b);

      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        organizer: account,
        organizerAddress: account,
        endDate: formData.endDate,
        category: formData.category,
        milestones: milestones,
        metadata: {
          privacyLevel: formData.privacyLevel,
          allowAnonymous: Boolean(formData.allowAnonymous),
          requireVerification: Boolean(formData.requireVerification),
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
          Accept: "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      const responseData = await response.json();

      if (response.ok) {
        console.log("✅ Campaign created successfully:", responseData);

        // Show success message
        alert(
          "🎉 Campaign created successfully! You'll be redirected to your campaign page."
        );

        // Redirect to the campaign page
        if (responseData.eventId) {
          router.push(`/events/${responseData.eventId}`);
        } else {
          router.push("/campaigns");
        }
      } else {
        console.error("❌ Server error:", responseData);
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Unknown error occurred";
        alert(`❌ Failed to create campaign: ${errorMessage}`);
      }
    } catch (error) {
      console.error("💥 Error creating campaign:", error);

      let errorMessage = "Failed to create campaign. Please try again.";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(`❌ ${errorMessage}`);
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
        if (targetAmount > 100000) return false; // Max 100000 ETH
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
        if (targetAmount > 100000)
          return "Target amount cannot exceed 100000 ETH";
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Card className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                You need to connect your wallet to create a campaign and start
                fundraising
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200 hover:scale-[1.02]"
              >
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-4">
            Create Campaign
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Launch your privacy-preserving fundraising campaign with
            zero-knowledge technology
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
            {[
              { step: 1, label: "Basic Info", icon: FileText },
              { step: 2, label: "Funding", icon: DollarSign },
              { step: 3, label: "Milestones", icon: Target },
              { step: 4, label: "Review", icon: Settings },
            ].map(({ step, label, icon: Icon }, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      currentStep >= step
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs sm:text-sm font-medium ${
                      currentStep >= step ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-300 ${
                      currentStep > step
                        ? "bg-gradient-to-r from-purple-600 to-blue-600"
                        : "bg-gray-700"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-white text-xl sm:text-2xl">
              {currentStep === 1 && (
                <>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Basic Information
                </>
              )}
              {currentStep === 2 && (
                <>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  Funding Details
                </>
              )}
              {currentStep === 3 && (
                <>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  Milestones
                </>
              )}
              {currentStep === 4 && (
                <>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Review & Create
                </>
              )}
            </CardTitle>
            {!validateStep(currentStep) && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-300 font-medium">Validation Error</p>
                  <p className="text-red-400 text-sm mt-1">
                    {getValidationError(currentStep)}
                  </p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Campaign Name *
                    <span className="text-gray-500 font-normal ml-2">
                      ({formData.name.length}/100)
                    </span>
                  </label>
                  <Input
                    placeholder="Enter a compelling campaign name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("name", e.target.value)
                    }
                    className={`bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 h-12 ${
                      formData.name.length > 100
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    maxLength={100}
                  />
                  {formData.name.length > 100 && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Campaign name is too long
                    </div>
                  )}
                  {formData.name.length > 0 && formData.name.length < 3 && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <Info className="w-4 h-4" />
                      Campaign name must be at least 3 characters
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Description *
                    <span className="text-gray-500 font-normal ml-2">
                      ({formData.description.length}/2000)
                    </span>
                  </label>
                  <textarea
                    className={`w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 focus:ring-1 transition-all duration-200 min-h-[120px] resize-none ${
                      formData.description.length > 2000
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    rows={5}
                    placeholder="Describe your campaign goals, purpose, and what makes it special..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    maxLength={2000}
                  />
                  {formData.description.length > 2000 && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Description is too long
                    </div>
                  )}
                  {formData.description.length > 0 &&
                    formData.description.length < 10 && (
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <Info className="w-4 h-4" />
                        Description must be at least 10 characters
                      </div>
                    )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white focus:border-purple-500 focus:ring-purple-500 focus:ring-1 transition-all duration-200 h-12"
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="bg-gray-800 text-white"
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Tags
                    <span className="text-gray-500 font-normal ml-2">
                      (comma-separated, optional)
                    </span>
                  </label>
                  <Input
                    placeholder="blockchain, privacy, fundraising, innovation"
                    value={formData.tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("tags", e.target.value)
                    }
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 h-12"
                  />
                  <p className="text-gray-500 text-sm">
                    Add relevant tags to help people discover your campaign
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Funding Details */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Target Amount (ETH) *
                    <span className="text-gray-500 font-normal ml-2">
                      (Maximum: 100000 ETH)
                    </span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="100000"
                      placeholder="0.000"
                      value={formData.targetAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("targetAmount", e.target.value)
                      }
                      className={`bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 h-12 pr-12 ${
                        formData.targetAmount &&
                        (parseFloat(formData.targetAmount) <= 0 ||
                          parseFloat(formData.targetAmount) > 100000)
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                      ETH
                    </span>
                  </div>
                  {formData.targetAmount &&
                    parseFloat(formData.targetAmount) > 100000 && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Target amount cannot exceed 100000 ETH
                      </div>
                    )}
                  {formData.targetAmount &&
                    parseFloat(formData.targetAmount) <= 0 && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Target amount must be greater than 0
                      </div>
                    )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    End Date *
                    <span className="text-gray-500 font-normal ml-2">
                      (Maximum: 1 year from now)
                    </span>
                  </label>
                  <div className="relative">
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
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 h-12"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  {formData.endDate &&
                    new Date(formData.endDate) <= new Date() && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        End date must be in the future
                      </div>
                    )}
                  {formData.endDate &&
                    new Date(formData.endDate) >
                      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) && (
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <Info className="w-4 h-4" />
                        End date is more than 1 year from now
                      </div>
                    )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Privacy Settings
                  </h3>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Privacy Level
                    </label>
                    <select
                      value={formData.privacyLevel}
                      onChange={(e) =>
                        handleInputChange("privacyLevel", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white focus:border-purple-500 focus:ring-purple-500 focus:ring-1 transition-all duration-200 h-12"
                    >
                      <option value="high" className="bg-gray-800 text-white">
                        High - Maximum anonymity with ZK proofs
                      </option>
                      <option value="medium" className="bg-gray-800 text-white">
                        Medium - Partial privacy protection
                      </option>
                      <option value="low" className="bg-gray-800 text-white">
                        Low - Basic privacy features
                      </option>
                    </select>
                  </div>

                  <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="allowAnonymous"
                        checked={formData.allowAnonymous}
                        onChange={(e) =>
                          handleInputChange("allowAnonymous", e.target.checked)
                        }
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label
                        htmlFor="allowAnonymous"
                        className="text-sm text-gray-300 cursor-pointer"
                      >
                        Allow anonymous donations
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="requireVerification"
                        checked={formData.requireVerification}
                        onChange={(e) =>
                          handleInputChange(
                            "requireVerification",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label
                        htmlFor="requireVerification"
                        className="text-sm text-gray-300 cursor-pointer"
                      >
                        Require donor verification for large donations
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Milestones */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Funding Milestones
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Set milestones to track progress and unlock achievements
                    </p>
                  </div>
                  <Button
                    onClick={addMilestone}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg hover:border-gray-600 transition-all duration-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="Amount (ETH)"
                            value={milestone.amount}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              updateMilestone(index, "amount", e.target.value)
                            }
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 h-10 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            ETH
                          </span>
                        </div>
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
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 h-10"
                        />
                      </div>
                      {formData.milestones.length > 1 && (
                        <Button
                          onClick={() => removeMilestone(index)}
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300 flex-shrink-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-100 mb-1">
                        Pro Tip
                      </h4>
                      <p className="text-blue-300 text-sm">
                        Milestones help donors track progress and unlock
                        achievements. Consider breaking your funding goal into
                        meaningful stages that show clear value delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    Campaign Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Campaign Name
                        </span>
                        <p className="text-white font-medium mt-1">
                          {formData.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Category
                        </span>
                        <p className="text-white font-medium mt-1 capitalize">
                          {formData.category}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Target Amount
                        </span>
                        <p className="text-white font-medium mt-1 text-lg">
                          {formData.targetAmount} ETH
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          End Date
                        </span>
                        <p className="text-white font-medium mt-1">
                          {new Date(formData.endDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Privacy Level
                        </span>
                        <p className="text-white font-medium mt-1 capitalize">
                          {formData.privacyLevel}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                          Milestones
                        </span>
                        <p className="text-white font-medium mt-1">
                          {
                            formData.milestones.filter(
                              (m) => m.amount && m.description
                            ).length
                          }{" "}
                          configured
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                      Description
                    </span>
                    <p className="text-gray-300 mt-2 leading-relaxed">
                      {formData.description}
                    </p>
                  </div>

                  {formData.tags && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.split(",").map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-900/30 border border-purple-700 rounded-full text-purple-300 text-sm"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-100 mb-2">
                        Ready to Launch with Privacy Protection
                      </h4>
                      <p className="text-green-300 leading-relaxed">
                        Your campaign will be created with cutting-edge
                        zero-knowledge privacy features. Donors can contribute
                        anonymously while maintaining complete transparency in
                        funding progress and milestone achievements.
                      </p>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-200">
                            Anonymous donations enabled
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-200">
                            Milestone tracking active
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-200">
                            Privacy level: {formData.privacyLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-200">
                            Achievement system ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-12 px-6 order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!validateStep(currentStep)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] h-12 px-6 order-1 sm:order-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] h-12 px-8 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Campaign
                    </>
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
