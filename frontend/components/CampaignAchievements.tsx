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
  const [activeTab, setActiveTab] = useState<"unlocked" | "pending">(
    "unlocked"
  );

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
          <div className="h-6 bg-gray-700/50 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-700/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchAchievements}
          className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-400">
          No achievements found for this campaign.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement Stats */}
      {showStats && stats && (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl">
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                  🏆 Achievement Progress
                </h3>
                <p className="text-gray-400 mt-1">
                  Track your campaign milestones and accomplishments
                </p>
              </div>
              <button
                onClick={checkNewAchievements}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Check for New
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {stats.unlocked}
                </div>
                <div className="text-sm text-gray-400">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {stats.pending}
                </div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-1">
                  {stats.completionRate}%
                </div>
                <div className="text-sm text-gray-400">Complete</div>
              </div>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${parseFloat(stats.completionRate)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Achievement Lists */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab("unlocked")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
              activeTab === "unlocked"
                ? "text-white bg-gray-800/60 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white hover:bg-gray-800/30"
            }`}
          >
            Unlocked ({unlockedAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
              activeTab === "pending"
                ? "text-white bg-gray-800/60 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white hover:bg-gray-800/30"
            }`}
          >
            Pending ({pendingAchievements.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "unlocked" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {unlockedAchievements.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/10 rounded-xl border border-green-500/30 backdrop-blur-sm">
                  <div className="text-6xl mb-6 animate-bounce">🏆</div>
                  <p className="text-green-300 font-bold text-xl mb-2">
                    No achievements unlocked yet
                  </p>
                  <p className="text-green-400 text-sm max-w-md mx-auto leading-relaxed">
                    Keep working on your campaign to unlock amazing achievements
                    and celebrate your milestones!
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
                    <div
                      key={achievement._id}
                      className="group relative overflow-hidden border border-green-500/30 bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-lg rounded-xl backdrop-blur-sm"
                    >
                      {/* Celebration sparkle effect */}
                      <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75" />

                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="text-2xl p-2 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-xl shadow-lg border border-green-500/30 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                              {achievement.icon}
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-green-300 text-lg leading-tight mb-1 truncate">
                                  {achievement.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="bg-green-600/60 text-green-200 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm border border-green-500/30">
                                    {achievement.type.replace("_", " ")}
                                  </span>
                                  <span className="border border-green-500/40 text-green-300 text-xs font-medium bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                    {getPriorityLabel(achievement.priority)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-yellow-400 text-xl opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                🌟
                              </div>
                            </div>

                            <p className="text-green-200 mb-3 leading-relaxed text-sm line-clamp-2">
                              {achievement.description}
                            </p>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-green-400">
                                <span className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm border border-green-500/30">
                                  <span>🎉</span>
                                  <span className="font-medium truncate">
                                    {new Date(
                                      achievement.unlockedAt!
                                    ).toLocaleDateString()}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingAchievements.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/10 rounded-xl border border-yellow-500/30 backdrop-blur-sm">
                  <div className="text-6xl mb-6 animate-pulse">🎉</div>
                  <p className="text-yellow-300 font-bold text-xl mb-2">
                    All achievements unlocked!
                  </p>
                  <p className="text-yellow-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
                    Incredible work! You've completed all available achievements
                    for this campaign!
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
                    <div
                      key={achievement._id}
                      className="group relative overflow-hidden border border-gray-600/50 bg-gradient-to-br from-gray-800/40 via-slate-800/30 to-gray-800/20 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 opacity-80 hover:opacity-95 rounded-xl backdrop-blur-sm"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="text-2xl p-2 bg-gradient-to-br from-gray-700/60 to-slate-700/40 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300 grayscale group-hover:grayscale-0 border border-gray-600/30 backdrop-blur-sm">
                              {achievement.icon}
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white text-xs">🔒</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-300 text-lg leading-tight mb-1 group-hover:text-gray-200 transition-colors truncate">
                                  {achievement.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="bg-gray-600/60 text-gray-300 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm border border-gray-600/30">
                                    {achievement.type.replace("_", " ")}
                                  </span>
                                  <span className="border border-gray-600/40 text-gray-400 text-xs font-medium bg-gray-700/30 px-2 py-1 rounded-full backdrop-blur-sm">
                                    {getPriorityLabel(achievement.priority)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-gray-500 text-xl opacity-60 group-hover:opacity-80 transition-opacity flex-shrink-0">
                                💎
                              </div>
                            </div>

                            <p className="text-gray-400 mb-3 leading-relaxed text-sm group-hover:text-gray-300 transition-colors line-clamp-2">
                              {achievement.description}
                            </p>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-gray-500">
                                <span className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded-full backdrop-blur-sm border border-gray-600/30">
                                  <span>⏳</span>
                                  <span className="font-medium">Locked</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
