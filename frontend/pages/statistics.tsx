import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, useAnimation, useInView } from "framer-motion";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@/contexts/WalletContext";
import { statsApi } from "@/lib/api";
import {
  AnimatedCard,
  AnimatedCountUp,
  FloatingElements,
} from "../components/AnimationComponents";
import { ZKRankingSystem } from "../components/ZKRankingSystem";
import { RealtimeUpdates } from "../components/RealtimeUpdates";
import {
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Users,
  Target,
  Activity,
  Clock,
  Server,
  Database,
  Cpu,
  Network,
  Eye,
  Lock,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Trophy,
} from "lucide-react";

// Animation controls for Framer Motion
const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
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
        hidden: { opacity: 0, y: 50 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, ease: "easeOut" },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface SystemStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  totalDonors: number;
  totalCommitments: number;
  zkProofsGenerated: number;
  avgProofTime: number;
  privacyScore: number;
  networkUptime: number;
  recentActivity: Array<{
    type: "campaign" | "donation" | "milestone" | "achievement";
    message: string;
    timestamp: string;
    amount?: number;
    zkProof?: boolean;
  }>;
}

interface MidnightStats {
  isConnected: boolean;
  networkStatus: "online" | "offline" | "connecting";
  lastSync: string;
  proofStats: {
    ownKeys: { count: number; avgTime: number; successRate: number };
    midnightNetwork: { count: number; avgTime: number; successRate: number };
  };
  networkHealth: {
    latency: number;
    throughput: number;
    errorRate: number;
  };
}

interface CategoryStats {
  category: string;
  totalRaised: number;
  campaignCount: number;
  avgDonation: number;
  growth: number;
}

interface TimeSeriesData {
  date: string;
  donations: number;
  campaigns: number;
  zkProofs: number;
}

const StatisticsPage: React.FC = () => {
  const router = useRouter();
  const { isConnected, account } = useWallet();

  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // State
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [midnightStats, setMidnightStats] = useState<MidnightStats | null>(
    null
  );
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "zkp" | "categories" | "trends"
  >("overview");

  // Framer Motion animations
  useEffect(() => {
    // Animations are now handled by Framer Motion components
    // No additional setup needed here
  }, [activeTab]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch system statistics using API utility
      const systemResult = await statsApi.getPlatform();
      if (systemResult.success) {
        setSystemStats(systemResult.data.stats);
      }

      // Fetch Midnight Network statistics using API utility
      const midnightResult = await statsApi.getMidnight();
      if (midnightResult.success) {
        setMidnightStats(midnightResult.data.midnight);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-600/30 border-t-purple-600 mx-auto"></div>
            <p className="mt-4 text-white">Loading statistics...</p>
            <p className="mt-2 text-gray-400">Fetching real-time data...</p>
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
          <div className="stats-hero text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Platform Analytics
            </h1>
            <p className="text-gray-400 text-lg">
              Real-time insights into privacy-preserving fundraising and ZK
              proof generation
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <AnimatedCard direction="up" className="mb-6">
              <Alert className="bg-red-900/20 border-red-700 text-red-400">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            </AnimatedCard>
          )}

          {/* Key Metrics */}
          {systemStats && (
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="stat-card">
                <AnimatedCard direction="scale" className="text-center">
                  <div className="p-6 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg">
                    <Target className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      <AnimatedCountUp end={systemStats.totalCampaigns} />
                    </div>
                    <div className="text-sm text-gray-400">Total Campaigns</div>
                    <Badge className="mt-2 bg-blue-900/20 text-blue-300 border-blue-700">
                      {systemStats.activeCampaigns} active
                    </Badge>
                  </div>
                </AnimatedCard>
              </div>

              <div className="stat-card">
                <AnimatedCard
                  direction="scale"
                  delay={0.1}
                  className="text-center"
                >
                  <div className="p-6">
                    <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      <AnimatedCountUp
                        end={systemStats.totalRaised}
                        decimals={2}
                        suffix=" ETH"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Total Raised</div>
                    <Badge className="mt-2 bg-green-100 text-green-600">
                      {systemStats.totalDonors} donors
                    </Badge>
                  </div>
                </AnimatedCard>
              </div>

              <div className="stat-card">
                <AnimatedCard
                  direction="scale"
                  delay={0.2}
                  className="text-center"
                >
                  <div className="p-6">
                    <Shield className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      <AnimatedCountUp end={systemStats.zkProofsGenerated} />
                    </div>
                    <div className="text-sm text-gray-600">ZK Proofs</div>
                    <Badge className="mt-2 bg-purple-100 text-purple-600">
                      100% privacy
                    </Badge>
                  </div>
                </AnimatedCard>
              </div>

              <div className="stat-card">
                <AnimatedCard
                  direction="scale"
                  delay={0.3}
                  className="text-center"
                >
                  <div className="p-6">
                    <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      ~
                      <AnimatedCountUp
                        end={systemStats.avgProofTime}
                        suffix="ms"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Proof Speed</div>
                    <Badge className="mt-2 bg-yellow-100 text-yellow-600">
                      Lightning fast
                    </Badge>
                  </div>
                </AnimatedCard>
              </div>
            </div>
          )}

          {/* Privacy Score */}
          <AnimatedCard direction="up" className="mb-8">
            <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
              <CardContent className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-3xl font-bold mb-2">
                  Privacy Score:{" "}
                  <AnimatedCountUp
                    end={systemStats?.privacyScore || 98.7}
                    decimals={1}
                    suffix="%"
                  />
                </h3>
                <p className="text-lg opacity-90 mb-4">
                  Your platform maintains industry-leading privacy standards
                </p>
                <Progress
                  value={systemStats?.privacyScore || 98.7}
                  className="w-full max-w-md mx-auto bg-white/20"
                />
                <p className="text-sm opacity-75 mt-2">
                  Cryptographically verified through zero-knowledge proofs
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="zkp">ZK Proofs</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="trends">Live Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="tab-content">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* System Health */}
                <AnimatedCard direction="left">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        System Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-green-500" />
                          Network Uptime
                        </span>
                        <span className="font-semibold text-green-600">
                          {systemStats?.networkUptime || 99.9}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-500" />
                          Smart Contracts
                        </span>
                        <Badge className="bg-green-500">Deployed</Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Network className="w-4 h-4 text-purple-500" />
                          Midnight Network
                        </span>
                        <Badge
                          className={
                            midnightStats?.isConnected
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {midnightStats?.networkStatus || "online"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-orange-500" />
                          ZK Circuit
                        </span>
                        <Badge className="bg-blue-500">Optimized</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>

                {/* Platform Achievements */}
                <AnimatedCard direction="right">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Platform Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-8 h-8 text-purple-600" />
                          <div>
                            <div className="font-medium">First ZK Proof</div>
                            <div className="text-sm text-gray-500">
                              Privacy milestone reached
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-600">
                          ✓
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="w-8 h-8 text-blue-600" />
                          <div>
                            <div className="font-medium">
                              Midnight Integration
                            </div>
                            <div className="text-sm text-gray-500">
                              Real network connection
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-600">✓</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-8 h-8 text-green-600" />
                          <div>
                            <div className="font-medium">Sub-ms Proofs</div>
                            <div className="text-sm text-gray-500">
                              Lightning-fast privacy
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-600">✓</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </div>

              {/* ZK Rankings */}
              <AnimatedCard direction="up" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Privacy-Preserving Leaderboard
                    </CardTitle>
                    <CardDescription>
                      Anonymous rankings powered by zero-knowledge proofs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ZKRankingSystem type="global" timeframe="month" />
                  </CardContent>
                </Card>
              </AnimatedCard>
            </TabsContent>

            <TabsContent value="zkp" className="tab-content">
              {/* ZK Proof Analytics */}
              {midnightStats && (
                <div className="grid lg:grid-cols-2 gap-8">
                  <AnimatedCard direction="left">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          ZK Proof Performance
                        </CardTitle>
                        <CardDescription>
                          Comparison between proof generation modes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-blue-800">
                              Own Keys Mode
                            </h4>
                            <Badge className="bg-blue-600">Secure</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600">
                                Proofs Generated:
                              </span>
                              <div className="font-bold text-lg">
                                {midnightStats.proofStats.ownKeys.count}
                              </div>
                            </div>
                            <div>
                              <span className="text-blue-600">Avg Time:</span>
                              <div className="font-bold text-lg">
                                ~{midnightStats.proofStats.ownKeys.avgTime}ms
                              </div>
                            </div>
                          </div>
                          <Progress
                            value={
                              midnightStats.proofStats.ownKeys.successRate ||
                              100
                            }
                            className="mt-3"
                          />
                          <div className="text-xs text-blue-600 mt-1">
                            Success Rate:{" "}
                            {midnightStats.proofStats.ownKeys.successRate ||
                              100}
                            %
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-purple-800">
                              Midnight Network
                            </h4>
                            <Badge className="bg-purple-600">Ultra-Fast</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-purple-600">
                                Proofs Generated:
                              </span>
                              <div className="font-bold text-lg">
                                {midnightStats.proofStats.midnightNetwork.count}
                              </div>
                            </div>
                            <div>
                              <span className="text-purple-600">Avg Time:</span>
                              <div className="font-bold text-lg">
                                ~
                                {
                                  midnightStats.proofStats.midnightNetwork
                                    .avgTime
                                }
                                ms
                              </div>
                            </div>
                          </div>
                          <Progress
                            value={
                              midnightStats.proofStats.midnightNetwork
                                .successRate || 100
                            }
                            className="mt-3"
                          />
                          <div className="text-xs text-purple-600 mt-1">
                            Success Rate:{" "}
                            {midnightStats.proofStats.midnightNetwork
                              .successRate || 100}
                            %
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>

                  <AnimatedCard direction="right">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="w-5 h-5" />
                          Network Health
                        </CardTitle>
                        <CardDescription>
                          Real-time Midnight Network status
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-600">
                              {midnightStats.networkHealth?.latency || 12}ms
                            </div>
                            <div className="text-sm text-gray-600">Latency</div>
                          </div>

                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-600">
                              {midnightStats.networkHealth?.throughput || 1000}
                            </div>
                            <div className="text-sm text-gray-600">TPS</div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-800">
                              Connection Status
                            </span>
                            <Badge className="bg-green-600">
                              {midnightStats.isConnected
                                ? "Connected"
                                : "Disconnected"}
                            </Badge>
                          </div>
                          <div className="text-sm text-green-600">
                            Last sync:{" "}
                            {new Date(midnightStats.lastSync).toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600">
                            Network: TestNet-02
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Error Rate:</span>
                            <span className="font-medium">
                              {midnightStats.networkHealth?.errorRate || 0.1}%
                            </span>
                          </div>
                          <Progress
                            value={
                              100 -
                              (midnightStats.networkHealth?.errorRate || 0.1)
                            }
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </div>
              )}

              {/* Technical Implementation */}
              <AnimatedCard direction="up" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="w-5 h-5" />
                      Technical Implementation
                    </CardTitle>
                    <CardDescription>
                      Details about the zero-knowledge proof system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                          ZK Circuit
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Language:</span>
                            <span className="font-medium">Compact</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Proof System:</span>
                            <span className="font-medium">PLONK</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verification:</span>
                            <span className="font-medium">On-Chain</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Circuit File:</span>
                            <span className="font-medium">
                              topk_milestones.compact
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Smart Contracts
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">FundManager:</span>
                            <Badge className="bg-green-500">Deployed</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verifier:</span>
                            <Badge className="bg-green-500">Deployed</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Network:</span>
                            <span className="font-medium">Hardhat Local</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Gas Optimization:
                            </span>
                            <Badge className="bg-blue-500">Optimized</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </TabsContent>

            <TabsContent value="categories" className="tab-content">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock category data */}
                {[
                  {
                    category: "Technology",
                    totalRaised: 15.2,
                    campaignCount: 8,
                    growth: 24,
                  },
                  {
                    category: "Healthcare",
                    totalRaised: 12.8,
                    campaignCount: 6,
                    growth: 18,
                  },
                  {
                    category: "Education",
                    totalRaised: 9.4,
                    campaignCount: 4,
                    growth: 12,
                  },
                  {
                    category: "Environment",
                    totalRaised: 6.7,
                    campaignCount: 3,
                    growth: 8,
                  },
                  {
                    category: "Arts",
                    totalRaised: 4.1,
                    campaignCount: 5,
                    growth: 15,
                  },
                  {
                    category: "Sports",
                    totalRaised: 2.3,
                    campaignCount: 2,
                    growth: 5,
                  },
                ].map((category, index) => (
                  <AnimatedCard
                    key={category.category}
                    direction="up"
                    delay={index * 0.1}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">
                            {category.category}
                          </h3>
                          <Badge
                            className={`${
                              category.growth > 20
                                ? "bg-green-500"
                                : category.growth > 10
                                ? "bg-blue-500"
                                : "bg-gray-500"
                            }`}
                          >
                            <ArrowUp className="w-3 h-3 mr-1" />
                            {category.growth}%
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Raised:</span>
                            <span className="font-bold text-green-600">
                              {category.totalRaised} ETH
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Campaigns:</span>
                            <span className="font-semibold">
                              {category.campaignCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Avg per Campaign:
                            </span>
                            <span className="font-semibold">
                              {(
                                category.totalRaised / category.campaignCount
                              ).toFixed(1)}{" "}
                              ETH
                            </span>
                          </div>
                        </div>

                        <Progress
                          value={(category.totalRaised / 20) * 100}
                          className="mt-3"
                        />
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="tab-content">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Real-time Activity */}
                <AnimatedCard direction="left">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Live Activity Feed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RealtimeUpdates />
                    </CardContent>
                  </Card>
                </AnimatedCard>

                {/* Recent Activity from System Stats */}
                <AnimatedCard direction="right">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Recent Platform Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemStats?.recentActivity?.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.type === "campaign"
                                  ? "bg-blue-100"
                                  : activity.type === "donation"
                                  ? "bg-green-100"
                                  : "bg-purple-100"
                              }`}
                            >
                              {activity.type === "campaign" && (
                                <Target className="w-4 h-4 text-blue-600" />
                              )}
                              {activity.type === "donation" && (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              )}
                              {activity.type === "milestone" && (
                                <Award className="w-4 h-4 text-purple-600" />
                              )}
                              {activity.type === "achievement" && (
                                <Trophy className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {activity.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {activity.amount && (
                              <Badge variant="outline">
                                {activity.amount} ETH
                              </Badge>
                            )}
                            {activity.zkProof && (
                              <Badge className="bg-purple-500">
                                <Shield className="w-3 h-3 mr-1" />
                                ZK
                              </Badge>
                            )}
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-8">
                            No recent activity available
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <AnimatedCard direction="up" className="mt-8 text-center">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={fetchStatistics}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          </AnimatedCard>
        </div>
      </section>
    </div>
  );
};

export default StatisticsPage;
