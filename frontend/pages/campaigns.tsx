import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useWallet } from '../contexts/WalletContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Target, 
  Users, 
  Clock,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

interface Campaign {
  eventId: string;
  name: string;
  description: string;
  organizer: string;
  targetAmount: number;
  currentAmount: number;
  isActive: boolean;
  endDate: string;
  category: string;
  donorCount: number;
  milestones: number[];
  achievements: number;
  privacyLevel: 'high' | 'medium' | 'low';
  zkProofsGenerated: number;
}

const CampaignsPage: React.FC = () => {
  const router = useRouter();
  const { account, isConnected } = useWallet();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [sortBy, setSortBy] = useState('ranking');

  const categories = [
    'all', 'technology', 'healthcare', 'education', 'environment', 
    'community', 'arts', 'sports', 'charity', 'business'
  ];

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory, selectedStatus, sortBy, searchTerm]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        status: selectedStatus,
        sortBy: sortBy,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/proof/events?${params}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.events || []);
      } else {
        console.error('Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatETH = (amount: number) => {
    return `${amount.toFixed(3)} ETH`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => router.push(`/events/${campaign.eventId}`)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
              {campaign.name}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              by {campaign.organizer}
            </p>
          </div>
          <Badge variant="secondary" className="ml-2">
            {campaign.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatETH(campaign.currentAmount)}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getProgressPercentage(campaign.currentAmount, campaign.targetAmount).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Goal: {formatETH(campaign.targetAmount)}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {campaign.donorCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Donors</div>
          </div>
          <div>
            <div className="flex items-center justify-center text-green-600 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {campaign.achievements}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Milestones</div>
          </div>
          <div>
            <div className="flex items-center justify-center text-purple-600 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {getDaysRemaining(campaign.endDate)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Days left</div>
          </div>
        </div>

        {/* Privacy & ZK Info */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Privacy: {campaign.privacyLevel}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {campaign.zkProofsGenerated} ZK proofs
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              router.push(`/events/${campaign.eventId}?action=donate`);
            }}
          >
            <Heart className="w-4 h-4 mr-2" />
            Donate
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              router.push(`/events/${campaign.eventId}`);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Discover Campaigns
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Support causes you care about with privacy-preserving donations
              </p>
            </div>
            {isConnected && (
              <Button 
                onClick={() => router.push('/create-campaign')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ranking">Trending</option>
                <option value="newest">Newest</option>
                <option value="ending">Ending Soon</option>
                <option value="progress">Most Funded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.eventId} campaign={campaign} />
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No campaigns found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage;
