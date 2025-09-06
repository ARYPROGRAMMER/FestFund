import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/contexts/WalletContext';

interface UserProfile {
  _id: string;
  walletAddress: string;
  role: 'donor' | 'organizer' | 'admin';
  totalDonated: number;
  totalRaised: number;
  campaignsCreated: number;
  campaignsSupported: number;
  achievements: number;
  points: number;
  createdAt: string;
  lastActivity: string;
}

interface UserCampaign {
  _id: string;
  name: string;
  description: string;
  totalRaised: number;
  targetAmount: number;
  isActive: boolean;
  contributors: number;
  createdAt: string;
}

interface UserDonation {
  _id: string;
  eventId: string;
  eventName: string;
  amount: number;
  isAnonymous: boolean;
  zkMode: string;
  timestamp: string;
  proofGenerated: boolean;
}

const ProfilePage: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [donations, setDonations] = useState<UserDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'donations'>('overview');

  useEffect(() => {
    if (isConnected && account) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  const fetchUserProfile = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch(`/api/auth/profile/${account}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Fetch user campaigns (if organizer)
      const campaignsResponse = await fetch(`/api/events/organizer/${account}`);
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }

      // Fetch user donations
      const donationsResponse = await fetch(`/api/events/donor/${account}/donations`);
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        setDonations(donationsData);
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (newRole: 'donor' | 'organizer') => {
    if (!account) return;

    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          role: newRole
        }),
      });

      if (response.ok) {
        fetchUserProfile(); // Refresh profile
      } else {
        throw new Error('Failed to update role');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">User Profile</h1>
            <p className="text-gray-600 mb-6">Connect your wallet to view your profile</p>
            <Button onClick={() => window.location.reload()}>
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">User Profile</h1>
          <p className="text-gray-600">Manage your account and view your activity</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Welcome back!</CardTitle>
                <CardDescription className="font-mono text-sm mt-2">
                  {account}
                </CardDescription>
              </div>
              {profile && (
                <Badge 
                  variant="outline" 
                  className={`capitalize ${
                    profile.role === 'organizer' ? 'bg-blue-50 text-blue-700' :
                    profile.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                    'bg-green-50 text-green-700'
                  }`}
                >
                  {profile.role}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profile.totalDonated} ETH</div>
                  <div className="text-sm text-gray-600">Total Donated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.totalRaised} ETH</div>
                  <div className="text-sm text-gray-600">Total Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{profile.campaignsSupported}</div>
                  <div className="text-sm text-gray-600">Campaigns Supported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{profile.points}</div>
                  <div className="text-sm text-gray-600">Achievement Points</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Profile not found. Start by making a donation or creating a campaign.</p>
                <div className="space-x-2">
                  <Button onClick={() => window.location.href = '/campaigns'}>
                    View Campaigns
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/create-campaign'}>
                    Create Campaign
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Management */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your role and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Account Role</label>
                  <div className="flex gap-2">
                    <Button
                      variant={profile.role === 'donor' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateUserRole('donor')}
                    >
                      Donor
                    </Button>
                    <Button
                      variant={profile.role === 'organizer' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateUserRole('organizer')}
                    >
                      Organizer
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Organizers can create and manage campaigns
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Account Info</label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Member since: {new Date(profile.createdAt).toLocaleDateString()}</div>
                    <div>Last activity: {new Date(profile.lastActivity).toLocaleString()}</div>
                    <div>Achievements earned: {profile.achievements}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <Button
            variant={activeTab === 'overview' ? "default" : "ghost"}
            onClick={() => setActiveTab('overview')}
            className="flex-1"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'campaigns' ? "default" : "ghost"}
            onClick={() => setActiveTab('campaigns')}
            className="flex-1"
          >
            My Campaigns ({campaigns.length})
          </Button>
          <Button
            variant={activeTab === 'donations' ? "default" : "ghost"}
            onClick={() => setActiveTab('donations')}
            className="flex-1"
          >
            My Donations ({donations.length})
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  onClick={() => window.location.href = '/campaigns'}
                >
                  🔍 Browse Campaigns
                </Button>
                <Button 
                  className="w-full justify-start" 
                  onClick={() => window.location.href = '/create-campaign'}
                  variant="outline"
                >
                  ✏️ Create Campaign
                </Button>
                <Button 
                  className="w-full justify-start" 
                  onClick={() => window.location.href = '/achievements'}
                  variant="outline"
                >
                  🏆 View Achievements
                </Button>
                <Button 
                  className="w-full justify-start" 
                  onClick={() => window.location.href = '/statistics'}
                  variant="outline"
                >
                  📊 Platform Statistics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Recent donations */}
                  {donations.slice(0, 3).map(donation => (
                    <div key={donation._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Donated to {donation.eventName}</p>
                        <p className="text-xs text-gray-500">{new Date(donation.timestamp).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline">{donation.amount} ETH</Badge>
                    </div>
                  ))}
                  
                  {/* Recent campaigns */}
                  {campaigns.slice(0, 2).map(campaign => (
                    <div key={campaign._id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <div>
                        <p className="font-medium text-sm">Created "{campaign.name}"</p>
                        <p className="text-xs text-blue-600">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="bg-blue-100">Campaign</Badge>
                    </div>
                  ))}
                  
                  {donations.length === 0 && campaigns.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <Card key={campaign._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={campaign.isActive ? "default" : "secondary"}>
                      {campaign.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {campaign.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Raised:</span>
                      <span className="font-semibold">{campaign.totalRaised} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold">{campaign.targetAmount} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Contributors:</span>
                      <span className="font-semibold">{campaign.contributors}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((campaign.totalRaised / campaign.targetAmount) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => window.location.href = `/campaigns/${campaign._id}`}
                    >
                      View Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {campaigns.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-4">Create your first campaign to start fundraising</p>
                <Button onClick={() => window.location.href = '/create-campaign'}>
                  Create Campaign
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="space-y-4">
            {donations.map(donation => (
              <Card key={donation._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{donation.eventName}</h3>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>Amount: {donation.amount} ETH</span>
                        <span>Date: {new Date(donation.timestamp).toLocaleDateString()}</span>
                        <span>Mode: {donation.zkMode}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {donation.isAnonymous && (
                        <Badge variant="outline">Anonymous</Badge>
                      )}
                      {donation.proofGenerated && (
                        <Badge variant="default" className="bg-green-500">ZK Proof</Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/campaigns/${donation.eventId}`}
                      >
                        View Campaign
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {donations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No donations yet</h3>
                <p className="text-gray-500 mb-4">Start supporting campaigns to make a difference</p>
                <Button onClick={() => window.location.href = '/campaigns'}>
                  Browse Campaigns
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            ← Back to Home
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
