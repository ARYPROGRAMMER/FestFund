import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";
import { useWallet } from "../../contexts/WalletContext";
import { PrivateCommitmentForm } from "../../components/PrivateCommitmentForm";
import CampaignAchievements from "../../components/CampaignAchievements";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Users,
  DollarSign,
  Target,
  CheckCircle,
  Award,
  Globe,
  Twitter,
  Linkedin,
  Calendar,
} from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Event {
  _id: string;
  eventId: string;
  name: string;
  description: string;
  organizer: string;
  organizerAddress: string;
  milestones: number[];
  milestoneNames: string[];
  currentMilestone: number;
  isActive: boolean;
  createdAt: string;
  totalCommitments: number;
  totalAmount: number;
  uniqueDonors: number;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: string;
  category: string;
  ranking?: {
    score: number;
    views: number;
    likes: number;
    totalDonations: number;
    uniqueDonors: number;
    avgDonation: number;
  };
  metadata?: {
    category: string;
    tags: string[];
    imageUrl?: string;
    socialLinks?: {
      website?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  progressPercentage: number;
  isUrgent: boolean;
  daysLeft: number | null;
  recentCommitments?: Array<{
    _id: string;
    donorAddress: string;
    timestamp: string;
    isRevealed: boolean;
    revealedAmount?: string;
  }>;
}

export default function EventPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const { account, isConnected } = useWallet();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContributeForm, setShowContributeForm] = useState(false);

  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return "0.00".substring(0, decimals + 2);
    }
    return Number(value).toFixed(decimals);
  };

  // Helper function to safely format ETH amounts
  const formatETH = (amount: any): string => {
    return `${safeToFixed(amount, 4)} ETH`;
  };

  useEffect(() => {
    if (eventId && typeof eventId === "string") {
      loadEventDetails(eventId);
    }
  }, [eventId]);

  const loadEventDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/proof/events/${id}`);

      if (response.data.success) {
        const eventData = response.data.event;

        // Ensure numeric fields have default values
        const processedEvent = {
          ...eventData,
          currentAmount: Number(eventData.currentAmount) || 0,
          targetAmount: Number(eventData.targetAmount) || 0,
          progressPercentage: Number(eventData.progressPercentage) || 0,
          totalAmount: Number(eventData.totalAmount) || 0,
          uniqueDonors: Number(eventData.uniqueDonors) || 0,
          totalCommitments: Number(eventData.totalCommitments) || 0,
          milestones: Array.isArray(eventData.milestones)
            ? eventData.milestones.map((m: any) => Number(m) || 0)
            : [],
          ranking: eventData.ranking
            ? {
                ...eventData.ranking,
                score: Number(eventData.ranking.score) || 0,
                views: Number(eventData.ranking.views) || 0,
                likes: Number(eventData.ranking.likes) || 0,
                totalDonations: Number(eventData.ranking.totalDonations) || 0,
                uniqueDonors: Number(eventData.ranking.uniqueDonors) || 0,
                avgDonation: Number(eventData.ranking.avgDonation) || 0,
              }
            : undefined,
        };

        setEvent(processedEvent);
      } else {
        toast.error("Event not found");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error loading event details:", error);
      toast.error("Failed to load event details");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Event URL copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event URL copied to clipboard!");
    }
  };

  const handleContribute = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to contribute");
      return;
    }
    setShowContributeForm(true);
  };

  const handleContributionSuccess = () => {
    setShowContributeForm(false);
    loadEventDetails(eventId as string);
    toast.success("Contribution successful!");
  };

  const formatAddress = (address: string) => {
    if (!address || typeof address !== "string") {
      return "0x...";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Loading event details...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Event not found
          </p>
          <Button
            onClick={() => router.push("/")}
            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleShare} size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {event.status === "active" && (
                <Button
                  onClick={handleContribute}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Contribute Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showContributeForm ? (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Contribute to {event.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowContributeForm(false)}
                  className="absolute top-4 right-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Event
                </Button>
              </CardHeader>
              <CardContent>
                <PrivateCommitmentForm
                  eventId={event.eventId}
                  eventName={event.name}
                  milestones={event.milestones}
                  currentMilestone={event.currentMilestone}
                  targetAmount={event.targetAmount}
                  currentAmount={event.currentAmount}
                  organizerAddress={event.organizerAddress}
                  onPaymentComplete={handleContributionSuccess}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Header */}
              <Card className="bg-white dark:bg-slate-800 shadow-xl">
                {event.metadata?.imageUrl && (
                  <div className="h-64 overflow-hidden rounded-t-lg">
                    <img
                      src={event.metadata.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl font-bold mb-2">
                        {event.name}
                      </CardTitle>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {event.metadata?.category || event.category}
                        </Badge>
                        <Badge
                          className={
                            event.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }
                        >
                          {event.status}
                        </Badge>
                        {event.isUrgent && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                    {event.ranking && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600 mb-2">
                          <Award className="w-4 h-4" />
                          <span className="font-semibold">
                            {safeToFixed(event.ranking.score, 1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Ranking Score</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                    {event.description}
                  </p>

                  {/* Tags */}
                  {event.metadata?.tags && event.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {event.metadata.tags.map((tag, index) => (
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

                  {/* Social Links */}
                  {event.metadata?.socialLinks && (
                    <div className="flex items-center gap-4 mt-6">
                      {event.metadata.socialLinks.website && (
                        <a
                          href={event.metadata.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                        </a>
                      )}
                      {event.metadata.socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${event.metadata.socialLinks.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-500"
                        >
                          <Twitter className="w-4 h-4" />
                          Twitter
                        </a>
                      )}
                      {event.metadata.socialLinks.linkedin && (
                        <a
                          href={event.metadata.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-700 hover:text-blue-800"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card className="bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Funding Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(event.milestones || []).map((milestone, index) => {
                      const currentAmount = Number(event.currentAmount) || 0;
                      const milestoneAmount = Number(milestone) || 0;
                      const isAchieved = currentAmount >= milestoneAmount;
                      const progress =
                        milestoneAmount > 0
                          ? (currentAmount / milestoneAmount) * 100
                          : 0;
                      const isNext =
                        !isAchieved &&
                        index ===
                          (event.milestones || []).findIndex(
                            (m) => currentAmount < Number(m)
                          );

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            {isAchieved ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : isNext ? (
                              <Target className="w-5 h-5 text-purple-600" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                            )}
                            <div>
                              <p className="font-semibold">
                                {safeToFixed(milestoneAmount)} ETH
                              </p>
                              <p className="text-sm text-gray-500">
                                Milestone {index + 1}
                                {isNext && " (Next)"}
                                {event.milestoneNames?.[index] &&
                                  ` - ${event.milestoneNames[index]}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {safeToFixed(Math.min(progress || 0, 100), 1)}%
                            </p>
                            <Progress
                              value={Math.min(progress || 0, 100)}
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              <Card className="bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Campaign Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-2xl font-bold">
                        {formatETH(event.currentAmount)}
                      </span>
                      <span className="text-gray-500">
                        of {safeToFixed(event.targetAmount)} ETH
                      </span>
                    </div>
                    <Progress
                      value={Number(event.progressPercentage) || 0}
                      className="h-3"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {safeToFixed(event.progressPercentage, 1)}% funded
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-2xl font-bold">
                          {event.uniqueDonors}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Supporters</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-purple-600" />
                        <span className="text-2xl font-bold">
                          {event.totalCommitments}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Donations</p>
                    </div>
                  </div>

                  {event.daysLeft !== null && event.deadline && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">
                          {event.daysLeft === 0
                            ? "Last day!"
                            : `${event.daysLeft} days left`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Ends {new Date(event.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Organizer Info */}
              <Card className="bg-white dark:bg-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Campaign Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">{event.organizer}</p>
                      <p className="text-sm text-gray-500 font-mono">
                        {formatAddress(event.organizerAddress)}
                      </p>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        Created on{" "}
                        {new Date(event.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              {event.recentCommitments &&
                event.recentCommitments.length > 0 && (
                  <Card className="bg-white dark:bg-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {event.recentCommitments
                          .slice(0, 5)
                          .map((commitment, index) => (
                            <div
                              key={commitment._id}
                              className="flex items-center justify-between py-2 border-b last:border-b-0"
                            >
                              <div>
                                <p className="text-sm font-mono">
                                  {formatAddress(commitment.donorAddress)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    commitment.timestamp
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              {commitment.isRevealed &&
                              commitment.revealedAmount ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  {formatETH(commitment.revealedAmount)}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Private</Badge>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Campaign Achievements */}
              <CampaignAchievements
                eventId={event.eventId}
                className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                showStats={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
