import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useWallet } from "../contexts/WalletContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      const campaignsResponse = await axios.get(
        `${BACKEND_URL}/api/proof/events`
      );

      if (campaignsResponse.data.success) {
        const campaigns = campaignsResponse.data.events || [];
        const allAchievements: Achievement[] = [];

        // Fetch achievements for each campaign
        for (const campaign of campaigns.slice(0, 10)) {
          // Limit to first 10 campaigns
          try {
            const achievementResponse = await axios.get(
              `${BACKEND_URL}/api/achievements/${campaign.eventId}`
            );
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
      console.error("Error fetching achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!account) return;

    try {
      // Since there's no global user achievements endpoint,
      // we'll need to check achievements across all campaigns the user participated in
      const commitmentsResponse = await axios.get(
        `${BACKEND_URL}/api/proof/commitments/donor/${account}`
      );

      if (commitmentsResponse.data.success) {
        const userCampaigns = commitmentsResponse.data.commitments || [];
        const userAchievements: UserAchievement[] = [];

        for (const commitment of userCampaigns) {
          try {
            const achievementResponse = await axios.get(
              `${BACKEND_URL}/api/achievements/${commitment.eventId}`
            );
            if (achievementResponse.data.success) {
              const unlockedAchievements =
                achievementResponse.data.achievements.filter(
                  (a: any) => a.isUnlocked
                );
              userAchievements.push(
                ...unlockedAchievements.map((a: any) => ({
                  achievementId: a._id,
                  achievement: a,
                  unlockedAt: a.unlockedAt || new Date().toISOString(),
                  campaign: commitment.eventName || commitment.eventId,
                }))
              );
            }
          } catch (err) {
            console.log(`No achievements for campaign ${commitment.eventId}`);
          }
        }

        setUserAchievements(userAchievements);

        // Calculate basic stats
        setStats({
          totalAchievements: userAchievements.length,
          totalPoints: userAchievements.reduce(
            (sum, ua) => sum + (ua.achievement.points || 0),
            0
          ),
          campaignsParticipated: new Set(
            userAchievements.map((ua) => ua.campaign)
          ).size,
          rank: Math.floor(Math.random() * 100) + 1, // Placeholder rank
        });
      }
    } catch (err: any) {
      console.error("Error fetching user achievements:", err);
    }
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievementId === achievementId);
  };

  const getUnlockedDate = (achievementId: string) => {
    const userAchievement = userAchievements.find(
      (ua) => ua.achievementId === achievementId
    );
    return userAchievement ? userAchievement.unlockedAt : null;
  };

  const getCategories = () => {
    const categories = Array.from(new Set(achievements.map((a) => a.category)));
    return ["all", ...categories];
  };

  const filteredAchievements =
    selectedCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-200">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-600 border-t-transparent mx-auto mb-8"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Loading Achievements
            </h3>
            <p className="text-gray-600">Discovering your accomplishments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto space-y-16 lg:space-y-20">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Achievements
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Unlock achievements by participating in campaigns, reaching
            milestones, and making a difference in the community
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto">
            <Alert className="border-red-200 bg-red-50 shadow-lg">
              <AlertDescription className="text-red-800 text-center font-medium">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* User Stats */}
        {isConnected && stats && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {stats.totalAchievements}
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Unlocked
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {stats.totalPoints}
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Total Points
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {achievements.length}
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Available
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {stats.totalAchievements > 0
                      ? Math.round(
                          (stats.totalAchievements / achievements.length) * 100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Completion
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <div className="max-w-2xl mx-auto">
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
              <AlertDescription className="text-center text-blue-800 font-medium text-lg py-2">
                🔗 Connect your wallet to track your achievements and earn
                points
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Category Filter */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Filter by Category
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {getCategories().map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="lg"
                  onClick={() => setSelectedCategory(category)}
                  className={`capitalize px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      : "bg-white/80 text-gray-700 border-2 border-gray-300 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {category === "all" ? "🌟 All Categories" : `📂 ${category}`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 lg:gap-10">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = isAchievementUnlocked(achievement._id);
              const unlockedDate = getUnlockedDate(achievement._id);

              return (
                <Card
                  key={achievement._id}
                  className={`transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 border-0 overflow-hidden ${
                    isUnlocked
                      ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-xl ring-2 ring-green-200"
                      : "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle
                          className={`text-xl font-bold mb-3 leading-tight ${
                            isUnlocked ? "text-green-800" : "text-gray-800"
                          }`}
                        >
                          {achievement.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={`capitalize font-medium px-3 py-1 ${
                              isUnlocked
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                            }`}
                          >
                            📂 {achievement.category}
                          </Badge>
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              isUnlocked
                                ? "bg-green-200 text-green-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            ⭐ {achievement.points} pts
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                          isUnlocked
                            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg transform rotate-12"
                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {isUnlocked ? "🏆" : "🔒"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    <p
                      className={`text-base leading-relaxed ${
                        isUnlocked ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      {achievement.description}
                    </p>

                    <div
                      className={`p-4 rounded-xl border-2 border-dashed ${
                        isUnlocked
                          ? "bg-green-100/50 border-green-300 text-green-800"
                          : "bg-gray-100/50 border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🎯</span>
                        <div>
                          <strong className="text-sm font-semibold block mb-1">
                            How to unlock:
                          </strong>
                          <span className="text-sm">
                            {achievement.criteria}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isUnlocked && unlockedDate && (
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <span className="text-lg">🎉</span>
                          <div>
                            <div className="font-semibold text-sm">
                              Achievement Unlocked!
                            </div>
                            <div className="text-sm opacity-80">
                              {new Date(unlockedDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-gray-200">
              <div className="text-gray-400 text-8xl mb-8">🏆</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No achievements found
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {selectedCategory === "all"
                  ? "No achievements are available yet. Start participating in campaigns to unlock your first achievement!"
                  : `No achievements found in "${selectedCategory}" category. Try exploring other categories or contribute to campaigns to unlock new achievements.`}
              </p>
              {selectedCategory !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedCategory("all")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  🌟 View All Achievements
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center pt-8">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="bg-white/80 backdrop-blur-sm text-gray-700 border-2 border-gray-300 px-8 py-3 rounded-xl font-medium hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
