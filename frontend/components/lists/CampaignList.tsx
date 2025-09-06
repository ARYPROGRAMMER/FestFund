import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
  description: string;
  organizer: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  status: "active" | "completed" | "expired";
  ranking: {
    score: number;
    totalDonations: number;
    uniqueDonors: number;
    avgDonation: number;
  };
  metadata?: {
    imageUrl?: string;
    tags?: string[];
    socialLinks?: {
      website?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  createdAt: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  onCampaignSelect: (campaign: Campaign) => void;
  onContribute: (campaignId: string) => void;
  loading: boolean;
  showContributeButton?: boolean;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  onCampaignSelect,
  onContribute,
  loading,
  showContributeButton = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<
    "ranking" | "amount" | "date" | "progress"
  >("ranking");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "expired"
  >("all");

  const categories = [
    "all",
    "charity",
    "technology",
    "education",
    "healthcare",
    "environment",
    "arts",
    "sports",
    "other",
  ];

  const filteredAndSortedCampaigns = campaigns
    .filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.metadata?.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || campaign.category === selectedCategory;
      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "ranking":
          comparison = a.ranking.score - b.ranking.score;
          break;
        case "amount":
          comparison = a.currentAmount - b.currentAmount;
          break;
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "progress":
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          comparison = progressA - progressB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatEth = (amount: number) => {
    return `${amount.toFixed(4)} ETH`;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="bg-white dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 capitalize"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 capitalize"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>

            {/* Sort Options */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="ranking">Ranking</option>
                <option value="amount">Amount Raised</option>
                <option value="date">Date Created</option>
                <option value="progress">Progress</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-slate-800 animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded-t-lg"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedCampaigns.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No campaigns found matching your criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCampaigns.map((campaign) => {
            const progress = getProgressPercentage(
              campaign.currentAmount,
              campaign.targetAmount
            );
            const daysLeft = campaign.deadline
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(campaign.deadline).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : null;

            return (
              <Card
                key={campaign._id}
                className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onCampaignSelect(campaign)}
              >
                {/* Campaign Image */}
                {campaign.metadata?.imageUrl && (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={campaign.metadata.imageUrl}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white line-clamp-2">
                      {campaign.name}
                    </h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="font-semibold">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Raised
                      </p>
                      <p className="font-semibold text-sm">
                        {formatEth(campaign.currentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Target
                      </p>
                      <p className="font-semibold text-sm">
                        {formatEth(campaign.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Score: {campaign.ranking.score.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{campaign.ranking.uniqueDonors} donors</span>
                    </div>
                  </div>

                  {daysLeft !== null && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-4">
                      <Clock className="w-3 h-3" />
                      <span>
                        {daysLeft === 0 ? "Last day!" : `${daysLeft} days left`}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {campaign.metadata?.tags &&
                    campaign.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {campaign.metadata.tags
                          .slice(0, 3)
                          .map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}

                  {/* Action Button */}
                  {showContributeButton && campaign.status === "active" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContribute(campaign._id);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      size="sm"
                    >
                      Contribute Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAndSortedCampaigns.length} of {campaigns.length}{" "}
          campaigns
        </div>
      )}
    </div>
  );
};
