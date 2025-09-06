import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, useAnimation, useInView } from "framer-motion";
import { useWallet } from "../../contexts/WalletContext";
import { PrivateCommitmentForm } from "../../components/PrivateCommitmentForm";
import CampaignAchievements from "../../components/CampaignAchievements";
import { ZKLeaderboard } from "../../components/ZKLeaderboard";
import { ZKRankingSystem } from "../../components/ZKRankingSystem";
import {
  AnimatedCard,
  AnimatedCountUp,
  FloatingElements,
} from "../../components/AnimationComponents";
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
  User,
  DollarSign,
  Target,
  CheckCircle,
  Award,
  Globe,
  Twitter,
  Linkedin,
  Calendar,
  TrendingUp,
  Sparkles,
  Eye,
  Lock,
  Trophy,
} from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Animation component for smooth entrance effects
const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: "easeOut", delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

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
  const [userRank, setUserRank] = useState<number | null>(null);

  // Check if current user is the organizer
  const isCurrentUserOrganizer =
    event &&
    account &&
    (event.organizerAddress?.toLowerCase() === account.toLowerCase() ||
      event.organizer?.toLowerCase() === account.toLowerCase());

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

  useEffect(() => {
    if (eventId && account && isConnected) {
      loadUserRank(eventId as string, account);
    }
  }, [eventId, account, isConnected]);

  const loadUserRank = async (eventIdStr: string, userAddress: string) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/rankings/user-rank/${eventIdStr}/${userAddress}`
      );
      if (response.data.success) {
        setUserRank(response.data.rank);
      }
    } catch (error) {
      console.log("Could not fetch user rank:", error);
      // Don't show error to user, just don't display rank
    }
  };

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <FloatingElements />
        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300"
          >
            Loading event details...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <FloatingElements />
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Event Not Found
            </h2>
            <p className="text-gray-400 mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <FloatingElements />

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-black/95 backdrop-blur-sm border-b border-gray-700/70 sticky top-0 z-50"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="text-gray-300 border-gray-600 hover:border-purple-500 hover:text-purple-400 transition-all duration-300"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {event.status === "active" && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleContribute}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Contribute Now
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {showContributeForm ? (
          <div className="max-w-4xl mx-auto">
            <PrivateCommitmentForm
              eventId={event.eventId}
              eventName={event.name}
              milestones={event.milestones}
              currentMilestone={event.currentMilestone}
              targetAmount={event.targetAmount}
              currentAmount={event.currentAmount}
              organizerAddress={event.organizerAddress}
              onPaymentComplete={handleContributionSuccess}
              onBackToEvent={() => setShowContributeForm(false)}
            />
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
              {/* Main Content */}
              <div className="xl:col-span-2 space-y-8 lg:space-y-10">
                {/* Event Header */}
                <AnimatedSection delay={0.1}>
                  <AnimatedCard className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl overflow-hidden">
                    {event.metadata?.imageUrl && (
                      <div className="h-64 overflow-hidden relative">
                        <img
                          src={event.metadata.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                      </div>
                    )}
                    <CardHeader className="border-b border-gray-700/50 p-6 lg:p-8">
                      <div className="flex justify-between items-start gap-6">
                        <div>
                          <CardTitle className="text-3xl font-bold mb-3 text-white">
                            {event.name}
                          </CardTitle>
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                              {event.metadata?.category || event.category}
                            </Badge>
                            <Badge
                              className={
                                event.status === "active"
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm"
                                  : "bg-gray-500/20 text-gray-300 border border-gray-500/30 backdrop-blur-sm"
                              }
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  event.status === "active"
                                    ? "bg-green-400 animate-pulse"
                                    : "bg-gray-400"
                                }`}
                              />
                              {event.status}
                            </Badge>
                            {event.isUrgent && (
                              <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm animate-pulse">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          {event.ranking && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 }}
                              className="text-right"
                            >
                              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                <Award className="w-5 h-5" />
                                <span className="text-2xl font-bold">
                                  {safeToFixed(event.ranking.score, 1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">
                                Campaign Score
                              </p>
                            </motion.div>
                          )}
                          {userRank && isConnected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.6 }}
                              className="text-right"
                            >
                              <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Trophy className="w-5 h-5" />
                                <span className="text-2xl font-bold">
                                  #{userRank}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">Your Rank</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                      <p className="text-gray-300 text-lg leading-relaxed mb-8 lg:mb-10">
                        {event.description}
                      </p>

                      {/* Tags */}
                      {event.metadata?.tags &&
                        event.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-8 lg:mb-10">
                            {event.metadata.tags.map((tag, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                              >
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-gray-800/60 text-gray-300 border border-gray-600/50"
                                >
                                  #{tag}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        )}

                      {/* Social Links */}
                      {event.metadata?.socialLinks && (
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-700/50">
                          {event.metadata.socialLinks.website && (
                            <motion.a
                              href={event.metadata.socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                            >
                              <Globe className="w-4 h-4" />
                              Website
                            </motion.a>
                          )}
                          {event.metadata.socialLinks.twitter && (
                            <motion.a
                              href={`https://twitter.com/${event.metadata.socialLinks.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                            >
                              <Twitter className="w-4 h-4" />
                              Twitter
                            </motion.a>
                          )}
                          {event.metadata.socialLinks.linkedin && (
                            <motion.a
                              href={event.metadata.socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-500 transition-colors duration-300"
                            >
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </motion.a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </AnimatedCard>
                </AnimatedSection>
                   <AnimatedSection delay={0.6}>
                  <CampaignAchievements
                    eventId={event.eventId}
                    className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl rounded-lg p-6"
                    showStats={true}
                  />
                </AnimatedSection>


                {/* Milestones */}
                <AnimatedSection delay={0.2}>
                  <AnimatedCard className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
                    <CardHeader className="border-b border-gray-700/50 p-6 lg:p-8">
                      <CardTitle className="flex items-center gap-3 text-white text-xl lg:text-2xl">
                        <Target className="w-5 h-5 text-purple-400" />
                        Funding Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                      <div className="space-y-6 lg:space-y-8">
                        {(event.milestones || []).map((milestone, index) => {
                          const currentAmount =
                            Number(event.currentAmount) || 0;
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
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="flex items-center justify-between p-4 rounded-lg bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm"
                            >
                              <div className="flex items-center gap-3">
                                {isAchieved ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 * index }}
                                  >
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                  </motion.div>
                                ) : isNext ? (
                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 2,
                                    }}
                                  >
                                    <Target className="w-6 h-6 text-purple-400" />
                                  </motion.div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-500"></div>
                                )}
                                <div>
                                  <p className="font-semibold text-white">
                                    {safeToFixed(milestoneAmount)} ETH
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Milestone {index + 1}
                                    {isNext && (
                                      <span className="text-purple-400 font-medium">
                                        {" "}
                                        (Next Target)
                                      </span>
                                    )}
                                    {event.milestoneNames?.[index] &&
                                      ` - ${event.milestoneNames[index]}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-white mb-1">
                                  {safeToFixed(Math.min(progress || 0, 100), 1)}
                                  %
                                </p>
                                <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${Math.min(progress || 0, 100)}%`,
                                    }}
                                    transition={{
                                      delay: 0.5 + 0.1 * index,
                                      duration: 1,
                                    }}
                                    className={`h-full rounded-full ${
                                      isAchieved
                                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                        : isNext
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                        : "bg-gradient-to-r from-gray-500 to-gray-400"
                                    }`}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </AnimatedCard>
                </AnimatedSection>

                 {/* Campaign Rankings */}
                <AnimatedSection delay={0.75}>
                  <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl rounded-lg overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-gray-700/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white">
                          Campaign Rankings
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Privacy-preserving leaderboard for this campaign
                      </p>
                    </div>
                    <ZKRankingSystem
                      eventId={event.eventId}
                      type="campaign"
                      timeframe="all"
                      showPrivacyMetrics={true}
                    />
                  </div>
                </AnimatedSection>
              </div>

              {/* Sidebar */}
              <div className="space-y-8 lg:space-y-10">
                {/* Progress Card */}
                <AnimatedSection delay={0.3}>
                  <AnimatedCard className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
                    <CardHeader className="border-b border-gray-700/50">
                      <CardTitle className="text-xl text-white">
                        Campaign Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8 space-y-8 lg:space-y-10">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <div className="text-3xl font-bold text-white">
                            <AnimatedCountUp
                              end={Number(event.currentAmount) || 0}
                              decimals={4}
                              suffix=" ETH"
                            />
                          </div>
                          <span className="text-gray-400">
                            of {safeToFixed(event.targetAmount)} ETH
                          </span>
                        </div>
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                Number(event.progressPercentage) || 0
                              }%`,
                            }}
                            transition={{ delay: 0.8, duration: 1.5 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                          </motion.div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {safeToFixed(event.progressPercentage, 1)}% funded
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 lg:gap-8 pt-6 lg:pt-8 border-t border-gray-700/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            <span className="text-2xl font-bold text-white">
                              <AnimatedCountUp end={event.uniqueDonors} />
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">Supporters</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            <span className="text-2xl font-bold text-white">
                              <AnimatedCountUp end={event.totalCommitments} />
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">Donations</p>
                        </div>
                      </div>

                      {event.daysLeft !== null && event.deadline && (
                        <div className="pt-4 border-t border-gray-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold text-white">
                              {event.daysLeft === 0
                                ? "Last day!"
                                : `${event.daysLeft} days left`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Ends {new Date(event.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </AnimatedCard>
                </AnimatedSection>

                {/* Organizer Info */}
                <AnimatedSection delay={0.4}>
                  <AnimatedCard className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
                    <CardHeader className="border-b border-gray-700/50">
                      <CardTitle className="text-xl text-white">
                        Campaign Organizer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8">
                      <div className="space-y-6 lg:space-y-8">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            {/* <p className="font-semibold text-lg text-white">
                              {event.organizer}
                            </p> */}
                            {isCurrentUserOrganizer && (
                              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 w-fit">
                                <User className="w-3 h-3 mr-1" />
                                Your Campaign Address
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 font-mono bg-gray-800/60 px-3 py-2 rounded mt-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex-1 min-w-0 text-xs sm:text-sm overflow-hidden">
                                <span className="hidden lg:block break-all">
                                  {event.organizerAddress}
                                </span>
                                <span className="hidden sm:block lg:hidden">
                                  <span className="truncate block">
                                    {event.organizerAddress}
                                  </span>
                                </span>
                                <span className="block sm:hidden">
                                  {formatAddress(event.organizerAddress)}
                                </span>
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    event.organizerAddress || ""
                                  );
                                  toast.success("Address copied!");
                                }}
                                className="text-purple-400 hover:text-purple-300 transition-colors p-1 hover:bg-gray-700/50 rounded flex-shrink-0"
                                title="Copy full address"
                              >
                                📋
                              </button>
                            </div>
                          </div>
                          {isCurrentUserOrganizer && (
                            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <p className="text-purple-200 text-sm">
                                💡 As the organizer, you can still make
                                donations to your own campaign to help reach
                                milestones!
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t border-gray-700/50">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            Created on{" "}
                            {new Date(event.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </AnimatedCard>
                </AnimatedSection>

                {/* Recent Activity */}
                {event.recentCommitments &&
                  event.recentCommitments.length > 0 && (
                    <AnimatedSection delay={0.5}>
                      <AnimatedCard className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
                        <CardHeader className="border-b border-gray-700/50">
                          <CardTitle className="text-xl text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            {event.recentCommitments
                              .slice(0, 5)
                              .map((commitment, index) => (
                                <motion.div
                                  key={commitment._id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 * index }}
                                  className="flex items-center justify-between py-3 px-3 rounded-lg bg-gray-800/60 border border-gray-700/30"
                                >
                                  <div>
                                    <p className="text-sm font-mono text-gray-300">
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
                                    <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
                                      <Eye className="w-3 h-3 mr-1" />
                                      {formatETH(commitment.revealedAmount)}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Private
                                    </Badge>
                                  )}
                                </motion.div>
                              ))}
                          </div>
                        </CardContent>
                      </AnimatedCard>
                    </AnimatedSection>
                  )}

             
                {/* ZK Leaderboard */}
                <AnimatedSection delay={0.7}>
                  <ZKLeaderboard
                    donors={
                      event.recentCommitments?.map((commitment, index) => ({
                        address: commitment.donorAddress,
                        rank: index + 1,
                        commitmentHash: commitment._id,
                        timestamp: commitment.timestamp,
                        isRevealed: commitment.isRevealed,
                        revealedAmount: commitment.revealedAmount,
                      })) || []
                    }
                    eventName={event.name}
                    currentMilestone={event.currentMilestone || 0}
                    totalMilestones={event.milestones?.length || 0}
                  />
                </AnimatedSection>

               
              </div>

              
            </div>

         
          </div>
        )}
      </div>
    </div>
  );
}
