import React from "react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Shield,
  Eye,
  EyeOff,
  Trophy,
  Users,
  Target,
  ExternalLink,
} from "lucide-react";
import { getZKConfig, getZKModeInfo } from "../lib/zkConfig";

interface PrivacyStatsProps {
  totalCommitments: number;
  totalDonors: number;
  currentMilestone: number;
  totalMilestones: number;
  privacyLevel: number;
}

export const PrivacyStats: React.FC<PrivacyStatsProps> = ({
  totalCommitments,
  totalDonors,
  currentMilestone,
  totalMilestones,
  privacyLevel,
}) => {
  const zkConfig = getZKConfig();
  const zkInfo = getZKModeInfo(zkConfig);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* ZK Mode Information */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{zkInfo.icon}</span>
            <span className="font-semibold text-purple-800 dark:text-purple-200">
              ZK Mode
            </span>
          </div>
          <Badge variant={zkConfig.isMidnightNetwork ? "secondary" : "outline"}>
            {zkConfig.mode}
          </Badge>
        </div>
        <div className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-1">
          {zkInfo.name}
        </div>
        <p className="text-sm text-purple-600 dark:text-purple-300">
          Performance: {zkInfo.performance}
        </p>
        {zkConfig.isMidnightNetwork && (
          <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
            Official testnet-02 integration
          </p>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              Privacy Level
            </span>
          </div>
          <Badge variant="success">{privacyLevel}%</Badge>
        </div>
        <Progress value={privacyLevel} className="h-2" />
        <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
          Individual amounts completely private
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800 dark:text-green-200">
              Active Donors
            </span>
          </div>
          <Badge variant="default">{totalDonors}</Badge>
        </div>
        <div className="text-2xl font-bold text-green-800 dark:text-green-200">
          {totalCommitments} Commitments
        </div>
        <p className="text-sm text-green-600 dark:text-green-300">
          {zkConfig.isMidnightNetwork
            ? "Midnight Network secured"
            : "Cryptographically secured"}
        </p>
      </div>
    </div>
  );
};

interface PrivacyIndicatorProps {
  isPrivate: boolean;
  label: string;
  description: string;
}

export const PrivacyIndicator: React.FC<PrivacyIndicatorProps> = ({
  isPrivate,
  label,
  description,
}) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {isPrivate ? (
        <EyeOff className="w-5 h-5 text-green-600" />
      ) : (
        <Eye className="w-5 h-5 text-blue-600" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          <Badge variant={isPrivate ? "success" : "default"}>
            {isPrivate ? "Private" : "Public"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export const PrivacyExplainer: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Privacy Protection</h3>
      </div>

      <PrivacyIndicator
        isPrivate={true}
        label="Donation Amounts"
        description="Individual donation amounts are never revealed publicly"
      />

      <PrivacyIndicator
        isPrivate={false}
        label="Donor Rankings"
        description="Public leaderboard shows rankings without amounts"
      />

      <PrivacyIndicator
        isPrivate={false}
        label="Milestone Achievement"
        description="Cryptographic proof that targets are reached"
      />

      <PrivacyIndicator
        isPrivate={true}
        label="Total Fundraising Amount"
        description="Exact totals stay private, only milestone achievement shown"
      />
    </div>
  );
};
