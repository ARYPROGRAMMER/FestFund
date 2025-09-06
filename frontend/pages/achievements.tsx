import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/contexts/WalletContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Achievement {
  _id: string;
  name: string;
  description: string;
  category: string;
  criteria: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

interface UserAchievement {
  achievementId: string;
  achievement: Achievement;
  unlockedAt: string;
  campaign: string;
}

interface AchievementStats {
  totalAchievements: number;
  totalPoints: number;
  campaignsParticipated: number;
  rank: number;
}

const AchievementsPage: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchAchievements();
    if (isConnected && account) {
      fetchUserAchievements();
    }
  }, [isConnected, account]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      // Since achievements are per-campaign, fetch all campaigns first
      const campaignsResponse = await axios.get(`${BACKEND_URL}/api/proof/events`);
      
      if (campaignsResponse.data.success) {
        const campaigns = campaignsResponse.data.events || [];
        const allAchievements: Achievement[] = [];
        
        // Fetch achievements for each campaign
        for (const campaign of campaigns.slice(0, 10)) { // Limit to first 10 campaigns
          try {
            const achievementResponse = await axios.get(`${BACKEND_URL}/api/achievements/${campaign.eventId}`);
            if (achievementResponse.data.success) {
              allAchievements.push(...achievementResponse.data.achievements);
            }
          } catch (err) {
            console.log(`No achievements for campaign ${campaign.eventId}`);
          }
        }
        
        setAchievements(allAchievements);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!account) return;

    try {
      // Since there's no global user achievements endpoint, 
      // we'll need to check achievements across all campaigns the user participated in
      const commitmentsResponse = await axios.get(`${BACKEND_URL}/api/proof/commitments/donor/${account}`);
      
      if (commitmentsResponse.data.success) {
        const userCampaigns = commitmentsResponse.data.commitments || [];
        const userAchievements: UserAchievement[] = [];
        
        for (const commitment of userCampaigns) {
          try {
            const achievementResponse = await axios.get(`${BACKEND_URL}/api/achievements/${commitment.eventId}`);
            if (achievementResponse.data.success) {
              const unlockedAchievements = achievementResponse.data.achievements.filter((a: any) => a.isUnlocked);
              userAchievements.push(...unlockedAchievements.map((a: any) => ({
                achievementId: a._id,
                achievement: a,
                unlockedAt: a.unlockedAt || new Date().toISOString(),
                campaign: commitment.eventName || commitment.eventId
              })));
            }
          } catch (err) {
            console.log(`No achievements for campaign ${commitment.eventId}`);
          }
        }
        
        setUserAchievements(userAchievements);
        
        // Calculate basic stats
        setStats({
          totalAchievements: userAchievements.length,
          totalPoints: userAchievements.reduce((sum, ua) => sum + (ua.achievement.points || 0), 0),
          campaignsParticipated: new Set(userAchievements.map(ua => ua.campaign)).size,
          rank: Math.floor(Math.random() * 100) + 1 // Placeholder rank
        });
      }
    } catch (err: any) {
      console.error('Error fetching user achievements:', err);
    }
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievementId === achievementId);
  };

  const getUnlockedDate = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    return userAchievement ? userAchievement.unlockedAt : null;
  };

  const getCategories = () => {
    const categories = Array.from(new Set(achievements.map(a => a.category)));
    return ['all', ...categories];
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading achievements...</p>
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Achievements</h1>
          <p className="text-gray-600">Unlock achievements by participating in campaigns and reaching milestones</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* User Stats */}
        {isConnected && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalAchievements}</div>
                <div className="text-sm text-gray-600">Unlocked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalAchievements}</div>
                <div className="text-sm text-gray-600">Available</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.totalAchievements > 0 ? Math.round((stats.totalAchievements / achievements.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Completion</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <Alert>
            <AlertDescription>
              Connect your wallet to track your achievements and earn points
            </AlertDescription>
          </Alert>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {getCategories().map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = isAchievementUnlocked(achievement._id);
            const unlockedDate = getUnlockedDate(achievement._id);
            
            return (
              <Card 
                key={achievement._id} 
                className={`transition-all duration-300 hover:shadow-lg ${
                  isUnlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg ${
                      isUnlocked ? 'text-green-800' : 'text-gray-800'
                    }`}>
                      {achievement.name}
                    </CardTitle>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isUnlocked ? '🏆' : '🔒'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={`text-sm ${
                    isUnlocked ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="capitalize">
                        {achievement.category}
                      </Badge>
                      <span className={`text-sm font-medium ${
                        isUnlocked ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {achievement.points} points
                      </span>
                    </div>
                    
                    <div className={`text-xs p-2 rounded ${
                      isUnlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <strong>Criteria:</strong> {achievement.criteria}
                    </div>
                    
                    {isUnlocked && unlockedDate && (
                      <div className="text-xs text-green-600 text-center pt-2 border-t border-green-200">
                        Unlocked: {new Date(unlockedDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No achievements found
            </h3>
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? 'No achievements are available yet'
                : `No achievements found in "${selectedCategory}" category`
              }
            </p>
            {selectedCategory !== 'all' && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory('all')}
                className="mt-4"
              >
                View All Achievements
              </Button>
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

export default AchievementsPage;
