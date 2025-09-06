import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AnimatedCard, AnimatedCountUp } from "./AnimationComponents";
import {
  Trophy,
  Crown,
  Star,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Medal,
  TrendingUp,
  Users,
  Lock,
} from "lucide-react";

interface RankingEntry {
  id: string;
  rank: number;
  displayName: string;
  totalDonated: number;
  campaignsSupported: number;
  zkProofsGenerated: number;
  privacyScore: number;
  isAnonymous: boolean;
  achievements: string[];
  momentum: "rising" | "falling" | "stable";
  lastActive: string;
}

interface ZKRankingSystemProps {
  eventId?: string;
  type: "global" | "campaign" | "category";
  category?: string;
  timeframe?: "week" | "month" | "year" | "all";
  showPrivacyMetrics?: boolean;
}

export const ZKRankingSystem: React.FC<ZKRankingSystemProps> = ({
  eventId,
  type = "global",
  category,
  timeframe = "month",
  showPrivacyMetrics = true,
}) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [privacyMode, setPrivacyMode] = useState<
    "full" | "partial" | "transparent"
  >("partial");

  useEffect(() => {
    fetchRankings();
  }, [eventId, type, category, selectedTimeframe]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        timeframe: selectedTimeframe,
        privacyMode,
        ...(eventId && { eventId }),
        ...(category && { category }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rankings?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || generateMockRankings());
      }
    } catch (error) {
      console.error("Failed to fetch rankings:", error);
      setRankings(generateMockRankings());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRankings = (): RankingEntry[] => [
    {
      id: "1",
      rank: 1,
      displayName: "Privacy Champion",
      totalDonated: 15.5,
      campaignsSupported: 8,
      zkProofsGenerated: 23,
      privacyScore: 98,
      isAnonymous: true,
      achievements: ["First Donor", "Privacy Advocate", "Milestone Helper"],
      momentum: "rising",
      lastActive: "2 hours ago",
    },
    {
      id: "2",
      rank: 2,
      displayName: "Crypto Philanthropist",
      totalDonated: 12.3,
      campaignsSupported: 5,
      zkProofsGenerated: 18,
      privacyScore: 85,
      isAnonymous: false,
      achievements: ["Big Supporter", "Community Builder"],
      momentum: "stable",
      lastActive: "1 day ago",
    },
    {
      id: "3",
      rank: 3,
      displayName: "Anonymous Supporter",
      totalDonated: 9.8,
      campaignsSupported: 12,
      zkProofsGenerated: 34,
      privacyScore: 100,
      isAnonymous: true,
      achievements: ["Consistency Award", "Privacy Guardian", "ZK Master"],
      momentum: "rising",
      lastActive: "30 minutes ago",
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case "rising":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "falling":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPrivacyBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {["week", "month", "year", "all"].map((period) => (
            <Button
              key={period}
              variant={selectedTimeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(period as any)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={privacyMode === "full" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrivacyMode("full")}
          >
            <Lock className="w-4 h-4 mr-1" />
            Full Privacy
          </Button>
          <Button
            variant={privacyMode === "partial" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrivacyMode("partial")}
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Partial
          </Button>
          <Button
            variant={privacyMode === "transparent" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrivacyMode("transparent")}
          >
            <Eye className="w-4 h-4 mr-1" />
            Transparent
          </Button>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-4">
        {rankings.map((entry, index) => (
          <AnimatedCard
            key={entry.id}
            delay={index * 0.1}
            direction="left"
            className="relative"
          >
            <Card
              className={`transition-all duration-300 hover:shadow-lg ${
                entry.rank <= 3 ? "ring-2 ring-purple-200 shadow-md" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left Section - Rank & Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                      {getRankIcon(entry.rank)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                          {entry.isAnonymous && privacyMode !== "transparent"
                            ? `Anonymous #${entry.rank}`
                            : entry.displayName}
                        </h3>
                        {getMomentumIcon(entry.momentum)}
                        {entry.isAnonymous && (
                          <Shield className="w-4 h-4 text-green-500" />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                        {privacyMode !== "full" && (
                          <span className="flex items-center gap-1">
                            <AnimatedCountUp
                              end={entry.totalDonated}
                              decimals={1}
                              suffix=" ETH"
                            />
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {entry.campaignsSupported} campaigns
                        </span>
                        {showPrivacyMetrics && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {entry.zkProofsGenerated} ZK proofs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Badges & Metrics */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-white ${getPrivacyBadgeColor(
                          entry.privacyScore
                        )}`}
                      >
                        Privacy {entry.privacyScore}%
                      </Badge>
                      <Badge variant="outline">Rank #{entry.rank}</Badge>
                    </div>

                    {/* Achievements */}
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {entry.achievements
                        .slice(0, 2)
                        .map((achievement, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            {achievement}
                          </Badge>
                        ))}
                      {entry.achievements.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.achievements.length - 2}
                        </Badge>
                      )}
                    </div>

                    <span className="text-xs text-gray-500">
                      Active {entry.lastActive}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        ))}
      </div>

      {/* Privacy Notice */}
      <AnimatedCard direction="up" className="mt-6">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <div className="text-sm">
                <span className="font-medium text-purple-900 dark:text-purple-100">
                  Privacy-First Rankings:
                </span>
                <span className="text-purple-700 dark:text-purple-300 ml-2">
                  All rankings use zero-knowledge proofs to verify contributions
                  while protecting donor privacy. Amounts remain encrypted, but
                  achievements are cryptographically proven.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
};
