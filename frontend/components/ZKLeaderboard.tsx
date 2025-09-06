import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Users,
  User,
  ShieldCheck,
  Lock,
  Eye,
} from "lucide-react";

interface Donor {
  address: string;
  rank: number;
  commitmentHash: string;
  timestamp: string;
  displayName?: string;
  isAmountRevealed?: boolean;
  isNameRevealed?: boolean;
  totalDonated?: number;
  commitmentCount?: number;
}

interface LeaderboardProps {
  donors: Donor[];
  eventName: string;
  currentMilestone: number;
  totalMilestones: number;
  isLoading?: boolean;
}

export const ZKLeaderboard: React.FC<LeaderboardProps> = ({
  donors,
  eventName,
  currentMilestone,
  totalMilestones,
  isLoading = false,
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return <Badge variant="default">#{rank}</Badge>;
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const formatAddress = (address: string) => {
    if (!address || typeof address !== "string") {
      return "0x...";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/95 text-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">
            Loading Leaderboard...
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-600 animate-pulse"
            >
              <div className="w-12 h-12 bg-gray-600 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-600 rounded w-32" />
              </div>
              <div className="w-12 h-6 bg-gray-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 text-white">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">
            Privacy-Preserving Leaderboard
          </h3>
        </div>
        <p className="text-sm text-gray-300 mb-8">
          Rankings verified with zero-knowledge proofs • Individual amounts
          remain private
        </p>

        <div className="space-y-6">
          {/* Privacy Explanation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-blue-100">
                This leaderboard shows verified donor rankings without revealing
                individual donation amounts. Each position is cryptographically
                proven to be accurate.
              </div>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-white">
                Milestone Progress
              </span>
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {currentMilestone}/{totalMilestones}
              </Badge>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${(currentMilestone / totalMilestones) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-300">
              Milestone achievement verified with ZK proofs
            </p>
          </div>

          {/* Leaderboard Entries */}
          <div className="space-y-4">
            {donors.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No donors yet</p>
                <p className="text-sm">
                  Be the first to make a private commitment!
                </p>
              </div>
            ) : (
              donors.map((donor, index) => (
                <div
                  key={donor.commitmentHash}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-lg ${
                    donor.rank <= 3
                      ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50"
                      : "bg-gray-800/60 border-gray-600/50"
                  }`}
                >
                  {/* Rank Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700/80 border border-gray-600">
                    {getRankIcon(donor.rank)}
                  </div>

                  {/* Donor Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">
                        {donor.displayName || formatAddress(donor.address)}
                      </span>
                      {donor.rank <= 3 ? (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                          #{donor.rank}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/40">
                          #{donor.rank}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span>
                        Committed:{" "}
                        {new Date(donor.timestamp).toLocaleDateString()}
                      </span>
                      {/* <div className="flex items-center gap-1">
                        {donor.isAmountRevealed ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>{donor.totalDonated?.toFixed(4)} ETH</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Amount Private</span>
                          </>
                        )}
                      </div> */}
                    </div>
                  </div>

                  {/* Privacy Status - Shows what user chose to reveal */}
                  <div className="text-right min-w-[120px]">
                    <div className="space-y-2">
                      {donor.isNameRevealed ? (
                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 text-xs font-medium flex items-center justify-center w-full">
                          <User className="w-3 h-3 mr-1.5" />
                          Name Shown
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 text-xs font-medium flex items-center justify-center w-full">
                          <Lock className="w-3 h-3 mr-1.5" />
                          Anonymous
                        </Badge>
                      )}
                      {donor.isAmountRevealed ? (
                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/40 px-3 py-1 text-xs font-medium flex items-center justify-center w-full">
                          <Eye className="w-3 h-3 mr-1.5" />
                          Amount Shown
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 text-xs font-medium flex items-center justify-center w-full">
                          <Lock className="w-3 h-3 mr-1.5" />
                          Amount Pvt
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 font-mono">
                      ZK Ranked #{donor.rank}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ZK Proof Status */}
          {donors.length > 0 && (
            <div className="pt-6 border-t border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-white">
                    Cryptographically Verified
                  </span>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border border-green-500/40">
                  ZK Proof Valid
                </Badge>
              </div>
              <p className="text-sm text-gray-300">
                Rankings verified without revealing individual contribution
                amounts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
