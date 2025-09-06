import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { smartContractService } from '@/lib/smartContracts';

interface Milestone {
  id: string;
  amount: number;
  description: string;
  isAchieved: boolean;
  provenAt?: string;
}

interface Commitment {
  _id: string;
  donorAddress: string;
  commitmentHash: string;
  amount: number;
  timestamp: string;
  proofGenerated: boolean;
  zkMode: string;
}

interface Campaign {
  _id: string;
  name: string;
  description: string;
  organizer: string;
  milestones: Milestone[];
  totalRaised: number;
  targetAmount: number;
  isActive: boolean;
  createdAt: string;
  privacyMode: string;
  zkMode: string;
  contractEventId?: string;
}

interface DonationData {
  amount: number;
  message?: string;
  isAnonymous: boolean;
  zkMode: 'own-keys' | 'midnight-network';
}

const CampaignDetailsPage: React.FC = () => {
  const router = useRouter();
  const { eventId } = router.query;
  const { 
    account,
    isConnected, 
    provider, 
    signer, 
    isConnecting 
  } = useWallet();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donationData, setDonationData] = useState<DonationData>({
    amount: 0,
    message: '',
    isAnonymous: false,
    zkMode: 'midnight-network'
  });
  const [donationLoading, setDonationLoading] = useState(false);
  const [smartContractsReady, setSmartContractsReady] = useState(false);

  // Initialize smart contracts when wallet is connected
  useEffect(() => {
    const initializeContracts = async () => {
      if (isConnected && provider && signer && !smartContractsReady) {
        try {
          const success = await smartContractService.initialize(provider, signer);
          setSmartContractsReady(success);
          if (!success) {
            console.warn('Smart contracts not available, using fallback mode');
          }
        } catch (error) {
          console.error('Failed to initialize smart contracts:', error);
        }
      }
    };

    initializeContracts();
  }, [isConnected, provider, signer, smartContractsReady]);

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch campaign');
        }

        const data = await response.json();
        setCampaign(data);

        // Fetch commitments
        const commitmentsResponse = await fetch(`/api/events/${eventId}/commitments`);
        if (commitmentsResponse.ok) {
          const commitmentsData = await commitmentsResponse.json();
          setCommitments(commitmentsData);
        }

        // Try to sync with smart contract data if available
        if (smartContractsReady && data.contractEventId) {
          try {
            const contractData = await smartContractService.getEventFromChain(data.contractEventId);
            console.log('📊 Contract data:', contractData);
            
            // Optional: Update local data with contract data
            // This ensures consistency between on-chain and off-chain data
          } catch (contractError) {
            console.warn('Could not fetch contract data:', contractError);
          }
        }

      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [eventId, smartContractsReady]);

  const handleDonation = async () => {
    if (!campaign || !isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (donationData.amount <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }

    try {
      setDonationLoading(true);
      setError(null);

      // Step 1: Generate ZK commitment
      const commitmentResponse = await fetch('/api/proof/commitment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: campaign._id,
          donorAddress: account,
          amount: donationData.amount,
          zkMode: donationData.zkMode,
          isAnonymous: donationData.isAnonymous,
          message: donationData.message
        }),
      });

      if (!commitmentResponse.ok) {
        throw new Error('Failed to generate commitment');
      }

      const commitmentResult = await commitmentResponse.json();
      console.log('✅ Commitment generated:', commitmentResult);

      // Step 2: Store commitment on-chain if smart contracts are available
      if (smartContractsReady && campaign.contractEventId) {
        try {
          const onChainResult = await smartContractService.makeCommitmentOnChain(
            campaign.contractEventId,
            commitmentResult.commitmentHash
          );
          
          if (onChainResult.success) {
            console.log('✅ Commitment stored on-chain:', onChainResult.txHash);
          } else {
            console.warn('Failed to store commitment on-chain:', onChainResult.error);
          }
        } catch (contractError) {
          console.warn('Contract interaction failed, continuing with off-chain storage:', contractError);
        }
      }

      // Step 3: Process payment (mock or real)
      const paymentResponse = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: campaign._id,
          commitmentId: commitmentResult.commitmentId,
          amount: donationData.amount,
          donorAddress: account,
          walletMode: provider ? 'real' : 'mock'
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment processing failed');
      }

      const paymentResult = await paymentResponse.json();
      console.log('✅ Payment processed:', paymentResult);

      // Refresh campaign data
      const updatedResponse = await fetch(`/api/events/${eventId}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setCampaign(updatedData);
      }

      // Refresh commitments
      const commitmentsResponse = await fetch(`/api/events/${eventId}/commitments`);
      if (commitmentsResponse.ok) {
        const commitmentsData = await commitmentsResponse.json();
        setCommitments(commitmentsData);
      }

      setDonationDialogOpen(false);
      setDonationData({
        amount: 0,
        message: '',
        isAnonymous: false,
        zkMode: 'midnight-network'
      });

      // Show success message
      alert(`✅ Donation successful! Amount: ${donationData.amount} ETH`);

    } catch (err: any) {
      setError(err.message);
      console.error('Donation error:', err);
    } finally {
      setDonationLoading(false);
    }
  };

  const handleMilestoneVerification = async (milestoneIndex: number) => {
    if (!campaign || !smartContractsReady || !campaign.contractEventId) {
      setError('Smart contracts not available for milestone verification');
      return;
    }

    try {
      // Generate proof for milestone
      const proofResponse = await fetch('/api/proof/milestone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: campaign._id,
          milestoneIndex: milestoneIndex,
          zkMode: campaign.zkMode || 'midnight-network'
        }),
      });

      if (!proofResponse.ok) {
        throw new Error('Failed to generate milestone proof');
      }

      const proofResult = await proofResponse.json();
      
      // Verify on-chain
      const verificationResult = await smartContractService.verifyMilestoneOnChain(
        campaign.contractEventId,
        proofResult.proof,
        proofResult.publicInputs
      );

      if (verificationResult.success) {
        console.log('✅ Milestone verified on-chain:', verificationResult.txHash);
        
        // Refresh campaign data
        const updatedResponse = await fetch(`/api/events/${eventId}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setCampaign(updatedData);
        }
      } else {
        throw new Error(verificationResult.error);
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Milestone verification error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800">Campaign not found</h2>
          <Button 
            onClick={() => router.push('/campaigns')} 
            className="mt-4"
          >
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{campaign.name}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{campaign.description}</p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge variant={campaign.isActive ? "default" : "secondary"}>
              {campaign.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              Privacy: {campaign.privacyMode}
            </Badge>
            <Badge variant="outline">
              ZK Mode: {campaign.zkMode}
            </Badge>
            {smartContractsReady && campaign.contractEventId && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                On-Chain
              </Badge>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Campaign Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Donation Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Raised: {campaign.totalRaised} ETH</span>
                    <span>Target: {campaign.targetAmount} ETH</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((campaign.totalRaised / campaign.targetAmount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{commitments.length} contributors</span>
                    <span className="font-semibold">
                      {Math.round((campaign.totalRaised / campaign.targetAmount) * 100)}% complete
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>Track progress toward campaign goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaign.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.isAchieved ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {milestone.isAchieved ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{milestone.description}</p>
                        <p className="text-sm text-gray-600">{milestone.amount} ETH</p>
                        {milestone.provenAt && (
                          <p className="text-xs text-green-600">
                            Verified: {new Date(milestone.provenAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {smartContractsReady && !milestone.isAchieved && campaign.totalRaised >= milestone.amount && (
                        <Button 
                          size="sm" 
                          onClick={() => handleMilestoneVerification(index)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commitments.slice(-5).reverse().map((commitment) => (
                    <div key={commitment._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {commitment.donorAddress === 'anonymous' ? 'Anonymous' : 
                           `${commitment.donorAddress.slice(0, 6)}...${commitment.donorAddress.slice(-4)}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(commitment.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{commitment.amount} ETH</p>
                        <Badge variant="outline" className="text-xs">
                          {commitment.zkMode}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {commitments.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No contributions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            
            {/* Donation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Make a Contribution</CardTitle>
                <CardDescription>
                  Support this campaign with a private donation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Connect your wallet to contribute
                    </p>
                    <Button 
                      onClick={() => window.location.reload()}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setDonationDialogOpen(true)}
                    >
                      Contribute Now
                    </Button>
                    
                    <Dialog open={donationDialogOpen} onOpenChange={setDonationDialogOpen}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Make a Private Contribution</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Amount (ETH)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={donationData.amount || ''}
                              onChange={(e) => setDonationData({
                                ...donationData,
                                amount: parseFloat(e.target.value) || 0
                              })}
                              placeholder="0.1"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Message (Optional)
                            </label>
                            <Input
                              value={donationData.message}
                              onChange={(e) => setDonationData({
                                ...donationData,
                                message: e.target.value
                              })}
                              placeholder="Good luck with the campaign!"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={donationData.isAnonymous}
                                onChange={(e) => setDonationData({
                                  ...donationData,
                                  isAnonymous: e.target.checked
                                })}
                              />
                              <span className="text-sm">Anonymous donation</span>
                            </label>

                            <div>
                              <label className="block text-sm font-medium mb-1">
                                ZK Mode
                              </label>
                              <select
                                value={donationData.zkMode}
                                onChange={(e) => setDonationData({
                                  ...donationData,
                                  zkMode: e.target.value as 'own-keys' | 'midnight-network'
                                })}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="midnight-network">Midnight Network (~1ms)</option>
                                <option value="own-keys">Own Keys (~418ms)</option>
                              </select>
                            </div>
                          </div>

                          <Button 
                            onClick={handleDonation}
                            disabled={donationLoading || donationData.amount <= 0}
                            className="w-full"
                          >
                            {donationLoading ? 'Processing...' : `Contribute ${donationData.amount} ETH`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                </CardContent>
            </Card>
            {/* Campaign Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Raised:</span>
                  <span className="font-semibold">{campaign.totalRaised} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target:</span>
                  <span className="font-semibold">{campaign.targetAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contributors:</span>
                  <span className="font-semibold">{commitments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-semibold">
                    {Math.round((campaign.totalRaised / campaign.targetAmount) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold text-sm">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {campaign.organizer}
                </p>
                {smartContractsReady && campaign.contractEventId && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Contract Event ID: {campaign.contractEventId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/campaigns')}
          >
            ← Back to All Campaigns
          </Button>
        </div>

      </div>
    </div>
  );
};

export default CampaignDetailsPage;
