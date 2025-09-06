import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/contexts/WalletContext';

interface SystemStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  totalDonors: number;
  totalCommitments: number;
  zkProofsGenerated: number;
  avgProofTime: number;
  recentActivity: Array<{
    type: 'campaign' | 'donation' | 'milestone';
    message: string;
    timestamp: string;
    amount?: number;
  }>;
}

interface MidnightStats {
  isConnected: boolean;
  networkStatus: 'online' | 'offline' | 'connecting';
  lastSync: string;
  proofStats: {
    ownKeys: { count: number; avgTime: number };
    midnightNetwork: { count: number; avgTime: number };
  };
}

const StatisticsPage: React.FC = () => {
  const { isConnected, account } = useWallet();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [midnightStats, setMidnightStats] = useState<MidnightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch system statistics
      const systemResponse = await fetch('/api/stats/system');
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemStats(systemData);
      }

      // Fetch Midnight Network statistics
      const midnightResponse = await fetch('/api/stats/midnight');
      if (midnightResponse.ok) {
        const midnightData = await midnightResponse.json();
        setMidnightStats(midnightData);
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Platform Statistics</h1>
          <p className="text-gray-600">Real-time insights into campaign performance and ZK proof generation</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* System Overview */}
        {systemStats && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{systemStats.totalCampaigns}</div>
                  <div className="text-sm text-gray-600">Total Campaigns</div>
                  <div className="text-xs text-green-600 mt-1">
                    {systemStats.activeCampaigns} active
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{systemStats.totalRaised} ETH</div>
                  <div className="text-sm text-gray-600">Total Raised</div>
                  <div className="text-xs text-gray-500 mt-1">
                    From {systemStats.totalDonors} donors
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">{systemStats.totalCommitments}</div>
                  <div className="text-sm text-gray-600">ZK Commitments</div>
                  <div className="text-xs text-purple-500 mt-1">
                    {systemStats.zkProofsGenerated} proofs
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600">{systemStats.avgProofTime}ms</div>
                  <div className="text-sm text-gray-600">Avg Proof Time</div>
                  <div className="text-xs text-orange-500 mt-1">
                    Latest generation
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Midnight Network Status */}
        {midnightStats && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Midnight Network Integration</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Network Status
                    <Badge 
                      variant={midnightStats.isConnected ? "default" : "secondary"}
                      className={midnightStats.isConnected ? "bg-green-500" : "bg-red-500"}
                    >
                      {midnightStats.networkStatus}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Connection to Midnight Network TestNet-02
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connection:</span>
                      <span className={`font-medium ${
                        midnightStats.isConnected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {midnightStats.isConnected ? 'Active' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(midnightStats.lastSync).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="font-medium text-blue-600">TestNet-02</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ZK Proof Performance</CardTitle>
                  <CardDescription>
                    Comparison between own-keys and Midnight Network modes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium text-blue-800">Own Keys Mode</div>
                        <div className="text-sm text-blue-600">
                          {midnightStats.proofStats.ownKeys.count} proofs generated
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          ~{midnightStats.proofStats.ownKeys.avgTime}ms
                        </div>
                        <div className="text-xs text-blue-500">avg time</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <div className="font-medium text-purple-800">Midnight Network</div>
                        <div className="text-sm text-purple-600">
                          {midnightStats.proofStats.midnightNetwork.count} proofs generated
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          ~{midnightStats.proofStats.midnightNetwork.avgTime}ms
                        </div>
                        <div className="text-xs text-purple-500">avg time</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {systemStats?.recentActivity && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest platform activities and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'campaign' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'donation' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'campaign' ? '📝' :
                         activity.type === 'donation' ? '💰' : '🏆'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{activity.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {activity.amount && (
                      <Badge variant="outline">
                        {activity.amount} ETH
                      </Badge>
                    )}
                  </div>
                ))}
                {systemStats.recentActivity.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔒 Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <p className="text-sm text-gray-600">
                All donations are private by default using zero-knowledge proofs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {midnightStats?.proofStats.midnightNetwork.avgTime || 1}ms
              </div>
              <p className="text-sm text-gray-600">
                Average ZK proof generation time using Midnight Network
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔗 Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">On-Chain</div>
              <p className="text-sm text-gray-600">
                All milestone verifications and commitments stored on blockchain
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              Details about the zero-knowledge proof system and smart contract integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">ZK Circuit Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Circuit Language:</span>
                    <span className="font-medium">Compact</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proof System:</span>
                    <span className="font-medium">PLONK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification:</span>
                    <span className="font-medium">On-Chain</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-medium">Midnight TestNet-02</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Smart Contracts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">FundManager:</span>
                    <span className="font-medium text-green-600">✓ Deployed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verifier:</span>
                    <span className="font-medium text-green-600">✓ Deployed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mock Token:</span>
                    <span className="font-medium text-green-600">✓ Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gas Optimization:</span>
                    <span className="font-medium text-blue-600">Optimized</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="text-center">
          <Button 
            onClick={fetchStatistics}
            disabled={loading}
            className="mr-4"
          >
            {loading ? 'Refreshing...' : 'Refresh Statistics'}
          </Button>
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

export default StatisticsPage;
