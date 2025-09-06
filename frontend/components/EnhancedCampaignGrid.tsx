import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AnimatedCard, AnimatedCountUp } from "./AnimationComponents";
import {
  Heart,
  Share2,
  Bookmark,
  Users,
  Target,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
} from "lucide-react";

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
  privacyLevel: "high" | "medium" | "low";
  zkProofsGenerated: number;
  image?: string;
  tags: string[];
  trending?: boolean;
  featured?: boolean;
  urgency?: "high" | "medium" | "low";
}

interface EnhancedCampaignGridProps {
  campaigns: Campaign[];
  loading?: boolean;
  viewMode?: "grid" | "list" | "featured";
  showFilters?: boolean;
  onCampaignClick?: (campaign: Campaign) => void;
}

export const EnhancedCampaignGrid: React.FC<EnhancedCampaignGridProps> = ({
  campaigns,
  loading = false,
  viewMode = "grid",
  showFilters = true,
  onCampaignClick,
}) => {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trending");

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === "all") return true;
    if (filter === "active") return campaign.isActive;
    if (filter === "urgent") return campaign.urgency === "high";
    if (filter === "featured") return campaign.featured;
    return campaign.category === filter;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      case "progress":
        return (
          b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount
        );
      case "recent":
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      case "amount":
        return b.currentAmount - a.currentAmount;
      default:
        return 0;
    }
  });

  const handleBookmark = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBookmarked = new Set(bookmarked);
    if (bookmarked.has(eventId)) {
      newBookmarked.delete(eventId);
    } else {
      newBookmarked.add(eventId);
    }
    setBookmarked(newBookmarked);
  };

  const handleShare = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: campaign.name,
        text: campaign.description,
        url: `${window.location.origin}/campaigns/${campaign.eventId}`,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `${window.location.origin}/campaigns/${campaign.eventId}`
      );
    }
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

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  if (loading) {
    return (
      <div
        className={`grid gap-6 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="animate-pulse bg-gray-900/50 backdrop-blur-sm border-gray-800"
          >
            <div className="h-48 bg-gray-800/50 rounded-t-lg"></div>
            <CardContent className="p-6 space-y-4">
              <div className="h-4 bg-gray-800/50 rounded w-3/4"></div>
              <div className="h-3 bg-gray-800/50 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-800/50 rounded"></div>
                <div className="h-3 bg-gray-800/50 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const CampaignCard = ({
    campaign,
    index,
  }: {
    campaign: Campaign;
    index: number;
  }) => (
    <AnimatedCard delay={index * 0.1} direction="up" className="h-full">
      <Card
        className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden bg-gray-900/50 backdrop-blur-sm border-gray-800"
        onClick={() =>
          onCampaignClick
            ? onCampaignClick(campaign)
            : router.push(`/campaigns/${campaign.eventId}`)
        }
      >
        {/* Image/Visual Header */}
        <div className="relative h-48 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 overflow-hidden">
          {campaign.image ? (
            <img
              src={campaign.image}
              alt={campaign.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8" />
                </div>
                <div className="text-sm font-medium">{campaign.category}</div>
              </div>
            </div>
          )}

          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {campaign.featured && (
              <Badge className="bg-yellow-500 text-yellow-900">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {campaign.trending && (
              <Badge className="bg-red-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => handleBookmark(campaign.eventId, e)}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  bookmarked.has(campaign.eventId)
                    ? "fill-current text-yellow-500"
                    : ""
                }`}
              />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => handleShare(campaign, e)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Urgency Indicator */}
          {campaign.urgency === "high" && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-red-500 text-white animate-pulse">
                <Clock className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                {campaign.category}
              </Badge>
              <span className="text-xs text-gray-500">
                {getDaysRemaining(campaign.endDate)} days left
              </span>
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-1">
              {campaign.name}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              by {campaign.organizer}
            </p>

            <p className="text-xs text-gray-500 line-clamp-2">
              {campaign.description}
            </p>
          </div>

          {/* Progress Section */}
          <div className="mb-4 flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                <AnimatedCountUp
                  end={campaign.currentAmount}
                  decimals={2}
                  suffix=" ETH"
                />
              </span>
              <span className="text-xs text-gray-500">
                {getProgressPercentage(
                  campaign.currentAmount,
                  campaign.targetAmount
                ).toFixed(1)}
                %
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${getProgressPercentage(
                    campaign.currentAmount,
                    campaign.targetAmount
                  )}%`,
                }}
              />
            </div>

            <div className="text-xs text-gray-500">
              Goal: {campaign.targetAmount} ETH
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div>
              <div className="flex items-center justify-center text-blue-600 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {campaign.donorCount}
              </div>
              <div className="text-xs text-gray-500">Donors</div>
            </div>

            <div>
              <div className="flex items-center justify-center text-green-600 mb-1">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {campaign.achievements}
              </div>
              <div className="text-xs text-gray-500">Milestones</div>
            </div>

            <div>
              <div className="flex items-center justify-center text-purple-600 mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {campaign.zkProofsGenerated}
              </div>
              <div className="text-xs text-gray-500">ZK Proofs</div>
            </div>
          </div>

          {/* Privacy & Tags */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">
                  Privacy: {campaign.privacyLevel}
                </span>
              </div>
            </div>

            {campaign.tags && campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {campaign.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {campaign.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{campaign.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 group"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/campaigns/${campaign.eventId}?action=donate`);
            }}
          >
            <Heart className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Support Campaign
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </AnimatedCard>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {[
              "all",
              "active",
              "featured",
              "urgent",
              "technology",
              "healthcare",
              "education",
            ].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption)}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            {["trending", "progress", "recent", "amount"].map((sortOption) => (
              <Button
                key={sortOption}
                variant={sortBy === sortOption ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(sortOption)}
              >
                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Grid */}
      <div
        className={`grid gap-6 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {sortedCampaigns.map((campaign, index) => (
          <CampaignCard
            key={campaign.eventId}
            campaign={campaign}
            index={index}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedCampaigns.length === 0 && (
        <AnimatedCard direction="up" className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No campaigns found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or create a new campaign
          </p>
          <Button onClick={() => router.push("/create-campaign")}>
            Create Campaign
          </Button>
        </AnimatedCard>
      )}
    </div>
  );
};
