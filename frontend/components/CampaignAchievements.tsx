import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Achievement {
  _id: string;
  eventId: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  metadata: {
    percentage?: number;
    amount?: number;
    donorCount?: number;
    milestone?: number;
  };
  isUnlocked: boolean;
  unlockedAt?: string;
  priority: number;
  generatedBy: 'auto' | 'gemini' | 'manual';
  createdAt: string;
}

interface AchievementStats {
  total: number;
  unlocked: number;
  pending: number;
  completionRate: string;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentUnlocks: Array<{
    title: string;
    unlockedAt: string;
    type: string;
  }>;
}

interface CampaignAchievementsProps {
  eventId: string;
  className?: string;
  showStats?: boolean;
}

export default function CampaignAchievements({ 
  eventId, 
  className = '',
  showStats = true 
}: CampaignAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchAchievements();
      if (showStats) {
        fetchStats();
      }
    }
  }, [eventId, showStats]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/achievements/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        setAchievements(data.achievements);
      } else {
        setError(data.error || 'Failed to fetch achievements');
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Network error while fetching achievements');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/achievements/${eventId}/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching achievement stats:', err);
    }
  };

  const checkNewAchievements = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/achievements/${eventId}/check`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.newUnlocks > 0) {
        // Refresh achievements to show new unlocks
        fetchAchievements();
        if (showStats) {
          fetchStats();
        }
        
        // Show celebration for new achievements
        data.unlockedAchievements.forEach((achievement: Achievement) => {
          showAchievementNotification(achievement);
        });
      }
    } catch (err) {
      console.error('Error checking achievements:', err);
    }
  };

  const showAchievementNotification = (achievement: Achievement) => {
    // You can integrate with a toast library here
    console.log(`🏆 Achievement Unlocked: ${achievement.title}`);
    
    // Simple browser notification (optional)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🏆 Achievement Unlocked!', {
        body: achievement.title,
        icon: '/favicon.ico',
      });
    }
  };

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const pendingAchievements = achievements.filter(a => !a.isUnlocked);

  const getAchievementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'campaign_created': 'bg-blue-500',
      'first_donation': 'bg-green-500',
      'milestone_reached': 'bg-purple-500',
      'funding_percentage': 'bg-yellow-500',
      'donor_milestone': 'bg-pink-500',
      'time_based': 'bg-orange-500',
      'engagement': 'bg-indigo-500',
      'completion': 'bg-red-500',
      'custom': 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getPriorityLabel = (priority: number) => {
    const labels = ['', 'Nice to Have', 'Good', 'Important', 'High Priority', 'Critical'];
    return labels[priority] || 'Unknown';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={fetchAchievements}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600">No achievements found for this campaign.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement Stats */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Achievement Progress
              <button
                onClick={checkNewAchievements}
                className="ml-auto px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Check for New
              </button>
            </CardTitle>
            <CardDescription>
              Track your campaign milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.unlocked}</div>
                <div className="text-sm text-gray-600">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.completionRate}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
            <Progress value={parseFloat(stats.completionRate)} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Achievement Lists */}
      <Tabs defaultValue="unlocked" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unlocked">
            Unlocked ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked" className="space-y-3">
          {unlockedAchievements.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No achievements unlocked yet. Keep working on your campaign!
            </p>
          ) : (
            unlockedAchievements
              .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
              .map((achievement) => (
                <Card key={achievement._id} className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-green-800">{achievement.title}</h3>
                          <Badge variant="secondary" className={getAchievementTypeColor(achievement.type)}>
                            {achievement.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {getPriorityLabel(achievement.priority)}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-4 text-xs text-green-600">
                          <span>Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}</span>
                          <span>Generated by {achievement.generatedBy}</span>
                        </div>
                      </div>
                      <div className="text-green-600">✅</div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingAchievements.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              All achievements unlocked! 🎉
            </p>
          ) : (
            pendingAchievements
              .sort((a, b) => b.priority - a.priority)
              .map((achievement) => (
                <Card key={achievement._id} className="border-gray-200 bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl grayscale">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-700">{achievement.title}</h3>
                          <Badge variant="secondary" className="bg-gray-400">
                            {achievement.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {getPriorityLabel(achievement.priority)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="text-xs text-gray-500">
                          Generated by {achievement.generatedBy}
                        </div>
                      </div>
                      <div className="text-gray-400">🔒</div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
