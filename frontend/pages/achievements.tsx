import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/contexts/WalletContext';

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
  earnedAt: string;
  points: number;
}

interface AchievementStats {
  totalAchievements: number;
  totalPoints: number;
  unlockedCount: number;
  categories: { [key: string]: number };
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
      const response = await fetch('/api/achievements');
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await response.json();
      setAchievements(data);
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
      const response = await fetch(`/api/achievements/user/${account}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserAchievements(data.achievements || []);
        setStats(data.stats || null);
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
    return userAchievement ? userAchievement.earnedAt : null;
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
                <div className="text-3xl font-bold text-purple-600">{stats.unlockedCount}</div>
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
                  {Math.round((stats.unlockedCount / stats.totalAchievements) * 100)}%
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
