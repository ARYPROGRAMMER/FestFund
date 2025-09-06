import React, { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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
  generatedBy: "auto" | "gemini" | "manual";
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
  className = "",
  showStats = true,
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/achievements/${eventId}`
      );
      const data = await response.json();

      if (data.success) {
        setAchievements(data.achievements);
      } else {
        setError(data.error || "Failed to fetch achievements");
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError("Network error while fetching achievements");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/achievements/${eventId}/stats`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching achievement stats:", err);
    }
  };

  const checkNewAchievements = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/achievements/${eventId}/check`,
        {
          method: "POST",
        }
      );
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
      console.error("Error checking achievements:", err);
    }
  };

  const showAchievementNotification = (achievement: Achievement) => {
    // You can integrate with a toast library here
    console.log(`🏆 Achievement Unlocked: ${achievement.title}`);

    // Simple browser notification (optional)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🏆 Achievement Unlocked!", {
        body: achievement.title,
        icon: "/favicon.ico",
      });
    }
  };

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const pendingAchievements = achievements.filter((a) => !a.isUnlocked);

  const getAchievementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      campaign_created: "bg-blue-500",
      first_donation: "bg-green-500",
      milestone_reached: "bg-purple-500",
      funding_percentage: "bg-yellow-500",
      donor_milestone: "bg-pink-500",
      time_based: "bg-orange-500",
      engagement: "bg-indigo-500",
      completion: "bg-red-500",
      custom: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getPriorityLabel = (priority: number) => {
    const labels = [
      "",
      "Nice to Have",
      "Good",
      "Important",
      "High Priority",
      "Critical",
    ];
    return labels[priority] || "Unknown";
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchAchievements}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">
          No achievements found for this campaign.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement Stats */}
      {showStats && stats && (
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              🏆 Achievement Progress
              <button
                onClick={checkNewAchievements}
                className="ml-auto px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Check for New
              </button>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Track your campaign milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.unlocked}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Unlocked
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.pending}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.completionRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Complete
                </div>
              </div>
            </div>
            <Progress
              value={parseFloat(stats.completionRate)}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Achievement Lists */}
      <Tabs defaultValue="unlocked" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="unlocked"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
          >
            Unlocked ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
          >
            Pending ({pendingAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked" className="space-y-4">
          {unlockedAchievements.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/15 dark:to-teal-900/10 rounded-xl border border-green-200 dark:border-green-800/50 shadow-sm">
              <div className="text-6xl mb-6 animate-bounce">🏆</div>
              <p className="text-green-800 dark:text-green-200 font-bold text-xl mb-2">
                No achievements unlocked yet
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm max-w-md mx-auto leading-relaxed">
                Keep working on your campaign to unlock amazing achievements and
                celebrate your milestones!
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <span className="text-2xl">🎯</span>
                <span className="text-2xl">✨</span>
                <span className="text-2xl">🚀</span>
              </div>
            </div>
          ) : (
            unlockedAchievements
              .sort(
                (a, b) =>
                  new Date(b.unlockedAt!).getTime() -
                  new Date(a.unlockedAt!).getTime()
              )
              .map((achievement) => (
                <Card
                  key={achievement._id}
                  className="group relative overflow-hidden border-green-200 dark:border-green-700/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-teal-900/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-green-100/50 dark:shadow-green-900/20"
                >
                  {/* Celebration sparkle effect */}
                  <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75" />

                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <div className="text-4xl p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/80 dark:to-emerald-800/60 rounded-2xl shadow-lg shadow-green-200 dark:shadow-green-900/40 group-hover:scale-110 transition-transform duration-300">
                          {achievement.icon}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-green-800 dark:text-green-100 text-xl leading-tight mb-2">
                              {achievement.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-2 py-1 shadow-sm"
                              >
                                {achievement.type.replace("_", " ")}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-700 dark:text-green-300 text-xs font-medium bg-green-50 dark:bg-green-900/30"
                              >
                                {getPriorityLabel(achievement.priority)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-green-600 dark:text-green-400 text-3xl opacity-80 group-hover:opacity-100 transition-opacity">
                            🌟
                          </div>
                        </div>

                        <p className="text-green-700 dark:text-green-200 mb-4 leading-relaxed text-base">
                          {achievement.description}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-2 bg-green-100 dark:bg-green-800/50 px-3 py-1 rounded-full">
                              <span>🎉</span>
                              <span className="font-medium">
                                Unlocked{" "}
                                {new Date(
                                  achievement.unlockedAt!
                                ).toLocaleDateString()}
                              </span>
                            </span>
                            <span className="flex items-center gap-2 opacity-75">
                              <span>🤖</span>
                              <span>{achievement.generatedBy}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingAchievements.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/15 dark:to-amber-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800/50 shadow-sm">
              <div className="text-6xl mb-6 animate-pulse">🎉</div>
              <p className="text-yellow-800 dark:text-yellow-200 font-bold text-xl mb-2">
                All achievements unlocked!
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
                Incredible work! You've completed all available achievements for
                this campaign!
              </p>
              <div className="flex justify-center space-x-3 text-2xl animate-bounce">
                <span>🏆</span>
                <span>🌟</span>
                <span>🎊</span>
                <span>🚀</span>
                <span>💫</span>
              </div>
            </div>
          ) : (
            pendingAchievements
              .sort((a, b) => b.priority - a.priority)
              .map((achievement) => (
                <Card
                  key={achievement._id}
                  className="group relative overflow-hidden border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-800/20 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 opacity-80 hover:opacity-95"
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <div className="text-4xl p-3 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-700/60 dark:to-slate-700/40 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300 grayscale group-hover:grayscale-0">
                          {achievement.icon}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-xs">🔒</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xl leading-tight mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                              {achievement.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className="bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium px-2 py-1 shadow-sm"
                              >
                                {achievement.type.replace("_", " ")}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-gray-400 text-gray-600 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-gray-800/50"
                              >
                                {getPriorityLabel(achievement.priority)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-gray-400 dark:text-gray-600 text-3xl opacity-60 group-hover:opacity-80 transition-opacity">
                            💎
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-base group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          {achievement.description}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-500">
                            <span className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                              <span>⏳</span>
                              <span className="font-medium">Locked</span>
                            </span>
                            <span className="flex items-center gap-2 opacity-75">
                              <span>🤖</span>
                              <span>{achievement.generatedBy}</span>
                            </span>
                          </div>
                        </div>
                      </div>
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
