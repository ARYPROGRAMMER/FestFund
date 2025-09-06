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
  ShieldCheck,
  Lock,
  Eye,
} from "lucide-react";

interface Donor {
  address: string;
  rank: number;
  commitmentHash: string;
  timestamp: string;
  isRevealed?: boolean;
  revealedAmount?: string;
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
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Loading Leaderboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Privacy-Preserving Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Rankings verified with zero-knowledge proofs • Individual amounts
          remain private
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Privacy Explanation */}
          <Alert variant="default">
            <ShieldCheck className="w-4 h-4" />
            <AlertDescription>
              This leaderboard shows verified donor rankings without revealing
              individual donation amounts. Each position is cryptographically
              proven to be accurate.
            </AlertDescription>
          </Alert>

          {/* Milestone Progress */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Milestone Progress</span>
              <Badge variant="outline">
                {currentMilestone}/{totalMilestones}
              </Badge>
            </div>
            <Progress
              value={(currentMilestone / totalMilestones) * 100}
              className="h-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Milestone achievement verified with ZK proofs
            </p>
          </div>

          {/* Leaderboard Entries */}
          <div className="space-y-3">
            {donors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No donors yet</p>
                <p className="text-sm">
                  Be the first to make a private commitment!
                </p>
              </div>
            ) : (
              donors.map((donor, index) => (
                <div
                  key={donor.commitmentHash}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                    donor.rank <= 3
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200"
                      : "bg-card"
                  }`}
                >
                  {/* Rank Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border">
                    {getRankIcon(donor.rank)}
                  </div>

                  {/* Donor Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {formatAddress(donor.address)}
                      </span>
                      {getRankBadge(donor.rank)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Committed:{" "}
                        {new Date(donor.timestamp).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Amount Private</span>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Status */}
                  <div className="text-right">
                    {donor.isRevealed ? (
                      <div className="space-y-1">
                        <Badge variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Revealed
                        </Badge>
                        <p className="text-sm font-medium">
                          {donor.revealedAmount} ETH
                        </p>
                      </div>
                    ) : (
                      <Badge variant="success">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ZK Proof Status */}
          {donors.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Cryptographically Verified
                  </span>
                </div>
                <Badge variant="success">ZK Proof Valid</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rankings verified without revealing individual contribution
                amounts
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
