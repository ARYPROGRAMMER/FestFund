import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Target, 
  Zap,
  Unlock,
  Lock,
  Star,
  Trophy
} from 'lucide-react';

interface MilestoneTrackerProps {
  milestones: number[];
  milestoneNames?: string[];
  currentAmount: number;
  currentMilestone: number;
  targetAmount: number;
  eventId: string;
  isOrganizer?: boolean;
  onMilestoneClick?: (milestoneIndex: number) => void;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  milestones,
  milestoneNames,
  currentAmount,
  currentMilestone,
  targetAmount,
  eventId,
  isOrganizer = false,
  onMilestoneClick
}) => {
  const getMilestoneStatus = (index: number, amount: number) => {
    if (currentAmount >= amount) return 'completed';
    if (index === currentMilestone) return 'active';
    if (index < currentMilestone) return 'completed';
    return 'pending';
  };

  const getMilestoneIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'active':
        return <Zap className="w-6 h-6 text-orange-500 animate-pulse" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getProgressToMilestone = (milestoneAmount: number) => {
    return Math.min((currentAmount / milestoneAmount) * 100, 100);
  };

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-green-500 to-emerald-600';
      case 'active':
        return 'from-orange-500 to-amber-600';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold">Milestone Progress</div>
            <div className="text-indigo-100 text-sm font-normal">
              Zero-knowledge verified achievements
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Campaign Progress
            </span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {Math.min((currentAmount / targetAmount) * 100, 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min((currentAmount / targetAmount) * 100, 100)} 
            className="h-2 bg-gray-200 dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{currentAmount.toFixed(2)} ETH raised</span>
            <span>Goal: {targetAmount.toFixed(2)} ETH</span>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Funding Milestones
          </h4>
          
          {milestones.map((amount, index) => {
            const status = getMilestoneStatus(index, amount);
            const progress = getProgressToMilestone(amount);
            const isClickable = isOrganizer && onMilestoneClick;
            
            return (
              <div
                key={index}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  status === 'completed' 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : status === 'active'
                    ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                } ${isClickable ? 'cursor-pointer hover:shadow-lg' : ''}`}
                onClick={isClickable ? () => onMilestoneClick(index) : undefined}
              >
                {/* Timeline connector */}
                {index < milestones.length - 1 && (
                  <div className={`absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b ${
                    status === 'completed' ? 'from-green-500 to-green-300' : 'from-gray-300 to-gray-200'
                  }`} />
                )}

                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${
                    getMilestoneColor(status)
                  } flex items-center justify-center shadow-lg`}>
                    {getMilestoneIcon(status, index)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {milestoneNames?.[index] || `Milestone ${index + 1}`}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Target: {amount.toFixed(2)} ETH
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {status === 'completed' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Trophy className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        )}
                        {status === 'active' && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                        {status === 'pending' && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for this milestone */}
                    {status !== 'completed' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>Progress to this milestone</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-1.5"
                        />
                      </div>
                    )}

                    {/* Achievement indicator */}
                    {status === 'completed' && (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-green-700 dark:text-green-300">
                        <Star className="w-3 h-3" />
                        <span>Achievement unlocked • ZK proof verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ZK Privacy Notice */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Unlock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                Zero-Knowledge Milestone Verification
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                Milestone achievements are cryptographically verified through ZK proofs without revealing 
                individual donation amounts. Donors maintain complete privacy while progress remains transparent.
              </div>
            </div>
          </div>
        </div>

        {/* Organizer Actions */}
        {isOrganizer && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Organizer Tools
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              Click on milestones to update progress and generate achievement proofs.
              All actions are recorded on-chain for transparency.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
