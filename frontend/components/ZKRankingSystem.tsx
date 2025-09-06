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
  donorAddress: string | null;
  totalDonated: number | null;
  campaignsSupported: number;
  zkProofsGenerated: number;
  privacyScore: number;
  isAnonymous: boolean;
  achievements: string[];
  momentum: "rising" | "falling" | "stable";
  lastActive: string;
  isAmountRevealed?: boolean;
  isNameRevealed?: boolean;
  commitmentCount?: number;
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
  console.log("🎯 ZKRankingSystem component mounted:", {
    eventId,
    type,
    category,
    timeframe,
    showPrivacyMetrics,
  });

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
    console.log("🎯 ZKRankingSystem: Fetching rankings...", {
      eventId,
      type,
      selectedTimeframe,
      privacyMode,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    });

    try {
      const params = new URLSearchParams({
        type,
        timeframe: selectedTimeframe,
        privacyMode,
        ...(eventId && { eventId }),
        ...(category && { category }),
      });

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rankings?${params}`;
      console.log("🌐 API URL:", url);

      const response = await fetch(url);
      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Rankings data received:", data);
        setRankings(data.rankings || []);
      } else {
        console.error("❌ API response not ok:", response.status);
        setRankings([]);
      }
    } catch (error) {
      console.error("Failed to fetch rankings:", error);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

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

  const formatAddress = (address: string) => {
    if (!address || typeof address !== "string") {
      return "0x...";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-gray-900/95 text-white p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-600 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="bg-gray-900/95 text-white p-6">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-6 opacity-50 text-gray-400" />
          <p className="text-xl font-semibold text-gray-300 mb-3">
            No Rankings Yet
          </p>
          <p className="text-gray-400">
            {type === "campaign"
              ? "Be the first to contribute to this campaign!"
              : "No contributors found for the selected criteria."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 text-white p-6 space-y-6">
      {/* Rankings */}
      <div className="space-y-4">
        {rankings.map((entry, index) => (
          <div
            key={entry.id}
            className={`transition-all duration-300 hover:shadow-xl rounded-lg ${
              entry.rank <= 3
                ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400/50 shadow-lg"
                : "bg-gray-800/60 border border-gray-600/50"
            }`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                {/* Left Section - Rank & Info */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                    {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-white font-mono">
                        {formatAddress(entry.donorAddress || entry.displayName)}
                      </h3>
                      {entry.isAnonymous && (
                        <Shield className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-400" />
                        <span>
                          {entry.isAmountRevealed
                            ? `${entry.totalDonated?.toFixed(4)} ETH`
                            : "Private Amount"}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span>
                          {entry.commitmentCount || entry.zkProofsGenerated}{" "}
                          contributions
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Badges & Metrics */}
                <div className="flex flex-col items-end space-y-3">
                  <div className="flex gap-2">
                    <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {entry.isNameRevealed ? "Named" : "Anonymous"}
                    </Badge>
                    <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                      #{entry.rank}
                    </Badge>
                  </div>

                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(entry.lastActive)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-purple-400 mt-1" />
          <div className="text-sm">
            <span className="font-semibold text-purple-200 block mb-2">
              Privacy-First Rankings:
            </span>
            <span className="text-purple-100 leading-relaxed">
              Rankings show contribution order while protecting donor privacy.
              Only revealed amounts are shown - private contributions are ranked
              by commitment order.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
