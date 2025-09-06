import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useWallet } from '../contexts/WalletContext';
import { 
  Plus, 
  Minus, 
  Target, 
  Calendar, 
  FileText,
  DollarSign,
  Settings,
  Shield,
  CheckCircle
} from 'lucide-react';

const CreateCampaignPage: React.FC = () => {
  const router = useRouter();
  const { account, isConnected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    endDate: '',
    category: 'technology',
    milestones: [{ amount: '', description: '' }],
    privacyLevel: 'high',
    allowAnonymous: true,
    requireVerification: false,
    tags: '',
  });

  const categories = [
    'technology', 'healthcare', 'education', 'environment', 
    'community', 'arts', 'sports', 'charity', 'business'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { amount: '', description: '' }]
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const handleSubmit = async () => {
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);

    try {
      const milestones = formData.milestones
        .filter(m => m.amount && parseFloat(m.amount) > 0)
        .map(m => parseFloat(m.amount))
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
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          createdBy: account,
          timestamp: new Date().toISOString(),
        }
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/proof/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert('Campaign created successfully!');
        router.push(`/events/${result.eventId}`);
      } else {
        const error = await response.json();
        alert(`Failed to create campaign: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.description && formData.category;
      case 2:
        return formData.targetAmount && parseFloat(formData.targetAmount) > 0 && formData.endDate;
      case 3:
        return formData.milestones.some(m => m.amount && parseFloat(m.amount) > 0);
      default:
        return true;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to connect your wallet to create a campaign
          </p>
          <Button onClick={() => router.push('/')}>
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create Campaign
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Launch your privacy-preserving fundraising campaign
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>Basic Info</span>
            <span>Funding</span>
            <span>Milestones</span>
            <span>Review</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <><FileText className="w-5 h-5" /> Basic Information</>}
              {currentStep === 2 && <><DollarSign className="w-5 h-5" /> Funding Details</>}
              {currentStep === 3 && <><Target className="w-5 h-5" /> Milestones</>}
              {currentStep === 4 && <><Settings className="w-5 h-5" /> Review & Create</>}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Name *
                  </label>
                  <Input
                    placeholder="Enter campaign name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="Describe your campaign..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="blockchain, privacy, fundraising"
                    value={formData.tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('tags', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Funding Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Amount (ETH) *
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={formData.targetAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('targetAmount', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('endDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Privacy Level
                  </label>
                  <select
                    value={formData.privacyLevel}
                    onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
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
                      onChange={(e) => handleInputChange('allowAnonymous', e.target.checked.toString())}
                      className="rounded"
                    />
                    <label htmlFor="allowAnonymous" className="text-sm text-gray-700 dark:text-gray-300">
                      Allow anonymous donations
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireVerification"
                      checked={formData.requireVerification}
                      onChange={(e) => handleInputChange('requireVerification', e.target.checked.toString())}
                      className="rounded"
                    />
                    <label htmlFor="requireVerification" className="text-sm text-gray-700 dark:text-gray-300">
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
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Amount (ETH)"
                          value={milestone.amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMilestone(index, 'amount', e.target.value)}
                        />
                      </div>
                      <div className="flex-2">
                        <Input
                          placeholder="Milestone description"
                          value={milestone.description}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMilestone(index, 'description', e.target.value)}
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
                  <p>💡 Milestones help donors track progress and unlock achievements</p>
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
                      <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                      <p className="text-gray-900 dark:text-white">{formData.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                      <p className="text-gray-900 dark:text-white">{formData.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Target:</span>
                      <p className="text-gray-900 dark:text-white">{formData.targetAmount} ETH</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">End Date:</span>
                      <p className="text-gray-900 dark:text-white">{formData.endDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Privacy Level:</span>
                      <p className="text-gray-900 dark:text-white">{formData.privacyLevel}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Milestones:</span>
                      <p className="text-gray-900 dark:text-white">
                        {formData.milestones.filter(m => m.amount).length} configured
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{formData.description}</p>
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
                        Your campaign will be created with zero-knowledge privacy features enabled.
                        Donors will be able to contribute anonymously while progress remains transparent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
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
