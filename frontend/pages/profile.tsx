import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import {
  AnimatedCard,
  AnimatedCountUp,
  FloatingElements,
} from "../components/AnimationComponents";
import { ZKRankingSystem } from "../components/ZKRankingSystem";
import { RealtimeUpdates } from "../components/RealtimeUpdates";
import {
  User,
  Award,
  Target,
  Activity,
  Shield,
  Eye,
  Lock,
  TrendingUp,
  Calendar,
  MapPin,
  Settings,
  Edit,
  Trophy,
  Star,
  Zap,
  Heart,
  Globe,
  BarChart3,
} from "lucide-react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface UserProfile {
  _id: string;
  walletAddress: string;
  role: "donor" | "organizer" | "admin";
  totalDonated: number;
  totalRaised: number;
  campaignsCreated: number;
  campaignsSupported: number;
  achievements: number;
  points: number;
  createdAt: string;
  lastActivity: string;
  privacyLevel: "low" | "medium" | "high";
  zkProofsGenerated: number;
  reputation: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface UserCampaign {
  _id: string;
  name: string;
  description: string;
  totalRaised: number;
  targetAmount: number;
  isActive: boolean;
  contributors: number;
  createdAt: string;
  zkProofsGenerated?: number;
  privacyScore?: number;
}

interface UserDonation {
  _id: string;
  eventId: string;
  eventName: string;
  amount: number;
  isAnonymous: boolean;
  zkMode: string;
  timestamp: string;
  proofGenerated: boolean;
  proofTime?: number;
  privacyLevel?: "low" | "medium" | "high";
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlockedAt: string;
  points: number;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { account, isConnected } = useWallet();

  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [donations, setDonations] = useState<UserDonation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "campaigns" | "donations" | "achievements"
  >("overview");

  // GSAP animations
  useEffect(() => {
    if (profile) {
      // Profile hero animation
      if (heroRef.current) {
        gsap.fromTo(
          ".profile-hero",
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
        );
      }

      // Stats animation
      if (statsRef.current) {
        ScrollTrigger.create({
          trigger: statsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.from(".stat-item", {
              scale: 0.8,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.7)",
            });
          },
        });
      }

      // Tab content animations
      gsap.from(".tab-content", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [profile, activeTab]);

  useEffect(() => {
    if (isConnected && account) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  const fetchUserProfile = async () => {
    if (!account) return;

    try {
      setLoading(true);

      // Fetch user profile
      const profileResponse = await fetch(`/api/proof/user/${account}/role`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Fetch user campaigns (if organizer)
      const campaignsResponse = await fetch(`/api/proof/events/organizer/${account}`);
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }

      // Fetch user donations
      const donationsResponse = await fetch(
        `/api/proof/commitments/donor/${account}`
      );
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        setDonations(donationsData);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (newRole: "donor" | "organizer") => {
    if (!account) return;

    try {
      // TODO: Implement backend endpoint for role updates
      // Backend needs: POST /api/auth/update-role
      console.log(`Role update requested: ${newRole} for ${account}`);
      
      // For now, just show a message
      alert(`Role update to ${newRole} requested. Backend endpoint needs to be implemented.`);
      
      /* 
      const response = await axios.post(`${BACKEND_URL}/api/auth/update-role`, {
        walletAddress: account,
        role: newRole,
      });

      if (response.data.success) {
        fetchUserProfile(); // Refresh profile
      } else {
        throw new Error(response.data.message || "Failed to update role");
      }
      */
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-4">User Profile</h1>
            <p className="text-gray-300 mb-6">
              Connect your wallet to view your profile
            </p>
            <Button onClick={() => window.location.reload()}>
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-600/30 border-t-purple-600 mx-auto"></div>
            <p className="mt-4 text-white">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <FloatingElements />

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="profile-hero text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Your Profile
            </h1>
            <p className="text-gray-600 text-lg">
              Privacy-preserving fundraising dashboard
            </p>
            {account && (
              <p className="text-sm text-gray-500 mt-2 font-mono">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <AnimatedCard direction="up" className="mb-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            </AnimatedCard>
          )}

          {/* Profile Stats */}
          {profile && (
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="stat-item">
                <AnimatedCard direction="scale" className="text-center">
                  <div className="p-6">
                    <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      <AnimatedCountUp
                        end={profile.totalDonated}
                        decimals={2}
                        suffix=" ETH"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Total Donated</div>
                  </div>
                </AnimatedCard>
              </div>

              <div className="stat-item">
                <AnimatedCard
                  direction="scale"
                  delay={0.1}
                  className="text-center"
                >
                  <div className="p-6">
                    <Target className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      <AnimatedCountUp
                        end={profile.totalRaised}
                        decimals={2}
                        suffix=" ETH"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Total Raised</div>
                  </div>
                </AnimatedCard>
              </div>

              <div className="stat-item">
                <AnimatedCard
                  direction="scale"
                  delay={0.2}
                  className="text-center"
                >
                  <div className="p-6">
                    <Shield className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      <AnimatedCountUp end={profile.zkProofsGenerated || 0} />
                    </div>
                    <div className="text-sm text-gray-600">ZK Proofs</div>
                  </div>
                </AnimatedCard>
              </div>

              <div className="stat-item">
                <AnimatedCard
                  direction="scale"
                  delay={0.3}
                  className="text-center"
                >
                  <div className="p-6">
                    <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      <AnimatedCountUp end={profile.points} />
                    </div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                </AnimatedCard>
              </div>
            </div>
          )}

          {/* Tier and Privacy Badge */}
          {profile && (
            <AnimatedCard direction="up" className="mb-8">
              <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Badge className="bg-white text-purple-600 px-4 py-2 text-lg font-semibold">
                      {profile.tier?.toUpperCase() || "BRONZE"} TIER
                    </Badge>
                    <Badge className="bg-white text-blue-600 px-4 py-2 text-lg font-semibold">
                      {profile.role?.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Privacy Level:{" "}
                    {profile.privacyLevel?.toUpperCase() || "HIGH"}
                  </h3>
                  <p className="opacity-90">
                    Your contributions are protected by zero-knowledge
                    cryptography
                  </p>
                  <div className="mt-4">
                    <Progress
                      value={
                        profile.privacyLevel === "high"
                          ? 100
                          : profile.privacyLevel === "medium"
                          ? 70
                          : 40
                      }
                      className="w-full max-w-md mx-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}

          {/* Profile not found */}
          {!profile && !loading && (
            <AnimatedCard direction="up" className="text-center py-12">
              <Card>
                <CardContent className="p-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                    Welcome to FestFund!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start your privacy-preserving fundraising journey by making
                    your first contribution or creating a campaign.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={() => router.push("/campaigns")}
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      Explore Campaigns
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push("/create-campaign")}
                    >
                      Create Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}
        </div>
      </section>

      {/* Tabs Section */}
      {profile && (
        <section className="relative z-10 px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="campaigns">
                  Campaigns ({campaigns.length})
                </TabsTrigger>
                <TabsTrigger value="donations">
                  Donations ({donations.length})
                </TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="tab-content">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Quick Actions */}
                  <AnimatedCard direction="left">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          className="w-full justify-start bg-gradient-to-r from-purple-500 to-blue-500"
                          onClick={() => router.push("/campaigns")}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Browse Campaigns
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => router.push("/create-campaign")}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Create Campaign
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => router.push("/statistics")}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Statistics
                        </Button>
                      </CardContent>
                    </Card>
                  </AnimatedCard>

                  {/* Real-time Updates */}
                  <AnimatedCard direction="right">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Live Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RealtimeUpdates />
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </div>

                {/* Privacy-Preserving Rankings */}
                <AnimatedCard direction="up" className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Your Ranking
                      </CardTitle>
                      <CardDescription>
                        Privacy-preserving leaderboard position
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ZKRankingSystem type="global" timeframe="month" />
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </TabsContent>

              <TabsContent value="campaigns" className="tab-content">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => (
                    <AnimatedCard key={campaign._id} direction="up" delay={0.1}>
                      <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {campaign.name}
                            </CardTitle>
                            <Badge
                              variant={
                                campaign.isActive ? "default" : "secondary"
                              }
                            >
                              {campaign.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {campaign.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Progress:</span>
                                <span className="font-semibold">
                                  {campaign.totalRaised}/{campaign.targetAmount}{" "}
                                  ETH
                                </span>
                              </div>
                              <Progress
                                value={
                                  (campaign.totalRaised /
                                    campaign.targetAmount) *
                                  100
                                }
                                className="w-full"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold text-purple-600">
                                  {campaign.contributors}
                                </div>
                                <div className="text-gray-500">
                                  Contributors
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-blue-600">
                                  {campaign.zkProofsGenerated || 0}
                                </div>
                                <div className="text-gray-500">ZK Proofs</div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                router.push(`/campaigns/${campaign._id}`)
                              }
                            >
                              Manage Campaign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  ))}

                  {campaigns.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <AnimatedCard direction="scale">
                        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No campaigns yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Create your first campaign to start fundraising
                        </p>
                        <Button
                          size="lg"
                          onClick={() => router.push("/create-campaign")}
                          className="bg-gradient-to-r from-purple-600 to-blue-600"
                        >
                          Create Campaign
                        </Button>
                      </AnimatedCard>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="donations" className="tab-content">
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <AnimatedCard key={donation._id} direction="up" delay={0.1}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {donation.eventName}
                                {donation.proofGenerated && (
                                  <Shield className="w-4 h-4 text-green-500" />
                                )}
                              </h3>
                              <div className="flex gap-6 text-sm text-gray-600 mt-2">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {donation.amount} ETH
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    donation.timestamp
                                  ).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  {donation.zkMode}
                                </span>
                                {donation.proofTime && (
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {donation.proofTime}ms
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              {donation.isAnonymous && (
                                <Badge variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Anonymous
                                </Badge>
                              )}
                              {donation.proofGenerated && (
                                <Badge className="bg-green-500">
                                  <Shield className="w-3 h-3 mr-1" />
                                  ZK Verified
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(`/campaigns/${donation.eventId}`)
                                }
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  ))}

                  {donations.length === 0 && (
                    <div className="text-center py-12">
                      <AnimatedCard direction="scale">
                        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No donations yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Start supporting campaigns with privacy-preserving
                          donations
                        </p>
                        <Button
                          size="lg"
                          onClick={() => router.push("/campaigns")}
                          className="bg-gradient-to-r from-purple-600 to-blue-600"
                        >
                          Browse Campaigns
                        </Button>
                      </AnimatedCard>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="tab-content">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement) => (
                    <AnimatedCard
                      key={achievement.id}
                      direction="up"
                      delay={0.1}
                    >
                      <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <CardContent className="p-6 text-center">
                          <div className="text-4xl mb-4">
                            {achievement.icon}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">
                            {achievement.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {achievement.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge
                              className={`
                              ${
                                achievement.tier === "platinum"
                                  ? "bg-gray-800"
                                  : ""
                              }
                              ${
                                achievement.tier === "gold"
                                  ? "bg-yellow-500"
                                  : ""
                              }
                              ${
                                achievement.tier === "silver"
                                  ? "bg-gray-500"
                                  : ""
                              }
                              ${
                                achievement.tier === "bronze"
                                  ? "bg-orange-600"
                                  : ""
                              }
                            `}
                            >
                              {achievement.tier}
                            </Badge>
                            <span className="text-sm font-semibold">
                              +{achievement.points} pts
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  ))}

                  {achievements.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <AnimatedCard direction="scale">
                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No achievements yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Start participating to unlock achievements
                        </p>
                        <Button
                          size="lg"
                          onClick={() => router.push("/campaigns")}
                          className="bg-gradient-to-r from-purple-600 to-blue-600"
                        >
                          Get Started
                        </Button>
                      </AnimatedCard>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProfilePage;
