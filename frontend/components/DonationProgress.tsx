import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Clock,
  Trophy,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface DonationProgressProps {
  campaign: {
    name: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    milestones: number[];
    currentMilestone: number;
    deadline?: string;
    uniqueDonors: number;
    totalCommitments: number;
    createdAt: string;
    status: 'active' | 'completed' | 'paused';
    ranking: {
      score: number;
      views: number;
      likes: number;
    };
  };
  showPrivateDetails?: boolean;
}

export const DonationProgress: React.FC<DonationProgressProps> = ({ 
  campaign, 
  showPrivateDetails = false 
}) => {
  const progressPercentage = Math.min((campaign.currentAmount / campaign.targetAmount) * 100, 100);
  const daysLeft = campaign.deadline 
    ? Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  const nextMilestone = campaign.milestones[campaign.currentMilestone];
  const milestoneProgress = nextMilestone 
    ? Math.min((campaign.currentAmount / nextMilestone) * 100, 100)
    : 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 border-purple-200 dark:border-purple-800 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {campaign.name}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(campaign.status)} text-white border-0`}
              >
                {campaign.status.toUpperCase()}
              </Badge>
              {showPrivateDetails ? (
                <EyeOff className="w-4 h-4 text-purple-600" />
              ) : (
                <Eye className="w-4 h-4 text-purple-600" />
              )}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {campaign.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {showPrivateDetails ? 'ℰ' : campaign.currentAmount.toFixed(2)} ETH raised
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Goal: {campaign.targetAmount.toFixed(2)} ETH
              </span>
            </div>
          </div>

          {/* Next Milestone Progress */}
          {nextMilestone && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Next Milestone
                </span>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {milestoneProgress.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={milestoneProgress} 
                className="h-2 bg-orange-100 dark:bg-orange-900/30"
              />
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Milestone {campaign.currentMilestone + 1}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {nextMilestone.toFixed(2)} ETH
                </span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.uniqueDonors}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Donors
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-2">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.totalCommitments}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ZK Commitments
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-2">
                <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.ranking.score.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ranking
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.ranking.views}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Views
              </div>
            </div>
          </div>

          {/* Time Information */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                Started {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
            {daysLeft !== null && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className={daysLeft > 7 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ended'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Privacy-Preserving Donations
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                All donation amounts are cryptographically protected through zero-knowledge proofs. 
                Donors receive recognition while maintaining complete financial privacy.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
