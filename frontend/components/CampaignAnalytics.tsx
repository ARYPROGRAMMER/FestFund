import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Trophy,
  Zap,
  Eye,
  Shield,
  Globe
} from 'lucide-react';

interface CampaignAnalyticsProps {
  campaignData: {
    totalRaised: number;
    targetAmount: number;
    donorCount: number;
    daysRemaining: number;
    averageDonation: number;
    topDonation: number;
    dailyDonations: Array<{ date: string; amount: number; count: number }>;
    milestoneProgress: Array<{ amount: number; achieved: boolean; date?: string }>;
    categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
    privacyMetrics: {
      privateCount: number;
      publicCount: number;
      zkProofsGenerated: number;
      midnightTransactions: number;
    };
  };
  isOrganizer?: boolean;
}

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({
  campaignData,
  isOrganizer = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    totalRaised,
    targetAmount,
    donorCount,
    daysRemaining,
    averageDonation,
    topDonation,
    dailyDonations,
    milestoneProgress,
    categoryBreakdown,
    privacyMetrics
  } = campaignData;

  const completionPercentage = Math.min((totalRaised / targetAmount) * 100, 100);
  const dailyAverage = dailyDonations.length > 0 
    ? dailyDonations.reduce((sum, day) => sum + day.amount, 0) / dailyDonations.length 
    : 0;

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'indigo' }: {
    icon: any;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
  }) => (
    <div className={`p-4 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/30 dark:to-${color}-800/30 rounded-lg border border-${color}-200 dark:border-${color}-800`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 bg-${color}-500 rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className={`text-sm font-medium text-${color}-700 dark:text-${color}-300`}>
            {title}
          </div>
          <div className={`text-lg font-bold text-${color}-900 dark:text-${color}-100`}>
            {value}
          </div>
          {subtitle && (
            <div className={`text-xs text-${color}-600 dark:text-${color}-400`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold">Campaign Analytics</div>
            <div className="text-blue-100 text-sm font-normal">
              Real-time insights and privacy metrics
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={DollarSign}
                title="Total Raised"
                value={`${totalRaised.toFixed(2)} ETH`}
                subtitle={`${completionPercentage.toFixed(1)}% of goal`}
                color="green"
              />
              <StatCard
                icon={Users}
                title="Total Donors"
                value={donorCount.toString()}
                subtitle={`Avg: ${averageDonation.toFixed(3)} ETH`}
                color="blue"
              />
              <StatCard
                icon={Target}
                title="Goal Progress"
                value={`${completionPercentage.toFixed(1)}%`}
                subtitle={`${(targetAmount - totalRaised).toFixed(2)} ETH remaining`}
                color="purple"
              />
              <StatCard
                icon={Clock}
                title="Time Remaining"
                value={`${daysRemaining} days`}
                subtitle={`Daily avg: ${dailyAverage.toFixed(3)} ETH`}
                color="orange"
              />
            </div>

            {/* Campaign Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-gray-600" />
                  Campaign Health
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Funding Velocity</span>
                    <Badge className={`${
                      dailyAverage > (targetAmount / (daysRemaining || 1)) 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {dailyAverage > (targetAmount / (daysRemaining || 1)) ? 'On Track' : 'Needs Boost'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Donor Engagement</span>
                    <Badge className={`${
                      donorCount > 10 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {donorCount > 10 ? 'High' : 'Growing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Largest Donation</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {topDonation.toFixed(3)} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
                  Category Breakdown
                </h4>
                <div className="space-y-3">
                  {categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{category.category}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Daily Donation Trends
              </h4>
              
              {/* Simple bar chart visualization */}
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  {dailyDonations.slice(-7).map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="mb-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div 
                        className="bg-blue-500 rounded-t mx-auto transition-all duration-500"
                        style={{ 
                          height: `${Math.max((day.amount / Math.max(...dailyDonations.map(d => d.amount))) * 60, 4)}px`,
                          width: '20px'
                        }}
                      />
                      <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {day.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {day.count} donors
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={Calendar}
                title="Best Day"
                value={`${Math.max(...dailyDonations.map(d => d.amount)).toFixed(2)} ETH`}
                subtitle="Highest single day"
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                title="Growth Rate"
                value={`${((dailyDonations.slice(-3).reduce((s, d) => s + d.amount, 0) / 3) / (dailyDonations.slice(-7, -3).reduce((s, d) => s + d.amount, 0) / 4) * 100 - 100).toFixed(1)}%`}
                subtitle="vs previous period"
                color="blue"
              />
              <StatCard
                icon={Activity}
                title="Momentum"
                value={dailyDonations.slice(-1)[0]?.amount > dailyAverage ? "High" : "Steady"}
                subtitle="Current trend"
                color="purple"
              />
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Shield}
                title="Private Donations"
                value={privacyMetrics.privateCount.toString()}
                subtitle={`${((privacyMetrics.privateCount / donorCount) * 100).toFixed(1)}% of total`}
                color="green"
              />
              <StatCard
                icon={Eye}
                title="Public Donations"
                value={privacyMetrics.publicCount.toString()}
                subtitle={`${((privacyMetrics.publicCount / donorCount) * 100).toFixed(1)}% of total`}
                color="blue"
              />
              <StatCard
                icon={Zap}
                title="ZK Proofs Generated"
                value={privacyMetrics.zkProofsGenerated.toString()}
                subtitle="Cryptographic verifications"
                color="purple"
              />
              <StatCard
                icon={Globe}
                title="Midnight Transactions"
                value={privacyMetrics.midnightTransactions.toString()}
                subtitle="Privacy-enhanced network"
                color="indigo"
              />
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Privacy Protection Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Anonymity Features</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Zero-knowledge proof verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Commitment scheme protection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Midnight Network integration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Anonymous ranking system</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Transparency Features</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Verifiable campaign progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Milestone achievement proofs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Aggregate statistics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Smart contract verification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Milestone Achievement Timeline
              </h4>
              
              {milestoneProgress.map((milestone, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    milestone.achieved
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.achieved
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {milestone.achieved ? (
                          <Trophy className="w-4 h-4" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Milestone {index + 1}: {milestone.amount.toFixed(2)} ETH
                        </div>
                        {milestone.achieved && milestone.date && (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Achieved on {new Date(milestone.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={`${
                      milestone.achieved
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {milestone.achieved ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {isOrganizer && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Organizer Insights
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Milestone achievements are automatically verified through ZK proofs and recorded on-chain.
                  Use these insights to optimize your campaign strategy and engagement timing.
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
