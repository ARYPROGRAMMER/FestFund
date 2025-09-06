import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Plus,
  Calendar,
  Target,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface CreateCampaignFormProps {
  onSubmit: (campaignData: any) => Promise<boolean>;
  isLoading: boolean;
}

export const CreateCampaignForm: React.FC<CreateCampaignFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    deadline: "",
    category: "charity" as
      | "charity"
      | "technology"
      | "education"
      | "healthcare"
      | "environment"
      | "arts"
      | "sports"
      | "other",
    tags: [] as string[],
    imageUrl: "",
    website: "",
    twitter: "",
    linkedin: "",
    milestones: ["1000", "5000", "10000"],
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.name.trim()) {
      setError("Campaign name is required");
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setError("Target amount must be a valid positive number");
      return;
    }

    // Validate milestones
    const milestones = formData.milestones
      .filter((m) => m.trim() !== "")
      .map((m) => parseFloat(m));

    if (milestones.length === 0) {
      setError("At least one milestone is required");
      return;
    }

    if (milestones.some((m) => isNaN(m) || m <= 0)) {
      setError("All milestones must be valid positive numbers");
      return;
    }

    try {
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        targetAmount: targetAmount,
        deadline: formData.deadline || null,
        milestones: milestones.sort((a, b) => a - b),
        metadata: {
          category: formData.category,
          tags: formData.tags,
          imageUrl: formData.imageUrl.trim() || null,
          socialLinks: {
            website: formData.website.trim() || null,
            twitter: formData.twitter.trim() || null,
            linkedin: formData.linkedin.trim() || null,
          },
        },
      };

      const success = await onSubmit(campaignData);
      if (success) {
        setSuccess("Campaign created successfully! Redirecting...");
        // Reset form
        setFormData({
          name: "",
          description: "",
          targetAmount: "",
          deadline: "",
          category: "charity",
          tags: [],
          imageUrl: "",
          website: "",
          twitter: "",
          linkedin: "",
          milestones: ["1000", "5000", "10000"],
        });
      }
    } catch (error: any) {
      setError(error.message || "Failed to create campaign");
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        <CardTitle className="flex items-center gap-3 text-2xl text-white">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          Create New Campaign
        </CardTitle>
        <p className="text-purple-100 mt-2">
          Launch your zero-knowledge fundraising campaign with privacy-preserving donation tracking
        </p>
      </div>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Success!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Basic Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Essential details about your campaign
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Campaign Name *
                </label>
                <Input
                  placeholder="Enter a compelling campaign name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  placeholder="Describe your campaign goals, impact, and how funds will be used..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white transition-colors"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Target Amount (ETH) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Deadline (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white transition-colors"
                >
                  <option value="charity">Charity</option>
                  <option value="technology">Technology</option>
                  <option value="education">Education</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="environment">Environment</option>
                  <option value="arts">Arts & Culture</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Campaign Image URL (Optional)
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Milestones Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Funding Milestones
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Set funding milestones to track progress and unlock achievements
              </p>
            </div>

            <div className="space-y-4">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-20">
                    Milestone {index + 1}:
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount in ETH"
                    value={milestone}
                    onChange={(e) => {
                      const newMilestones = [...formData.milestones];
                      newMilestones[index] = e.target.value;
                      setFormData({ ...formData, milestones: newMilestones });
                    }}
                    className="flex-1 bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  />
                  {formData.milestones.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMilestones = formData.milestones.filter(
                          (_, i) => i !== index
                        );
                        setFormData({ ...formData, milestones: newMilestones });
                      }}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({
                    ...formData,
                    milestones: [...formData.milestones, ""],
                  })
                }
                className="w-full border-dashed border-gray-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Social Links (Optional)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add links to build trust and provide more information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Website
                </label>
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  Twitter
                </label>
                <Input
                  type="url"
                  placeholder="https://twitter.com/username"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  LinkedIn
                </label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  className="bg-white/50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
