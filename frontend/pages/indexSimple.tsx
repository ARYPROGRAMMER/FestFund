import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useWallet } from "../contexts/WalletContext";
import { getZKConfig, getZKModeInfo } from "../lib/zkConfig";
import { PrivateCommitmentForm } from "../components/PrivateCommitmentForm";
import { OrganizerDashboard } from "../components/dashboards/OrganizerDashboard";
import { DonorDashboard } from "../components/dashboards/DonorDashboard";
import { PublicLanding } from "../components/dashboards/PublicLanding";
import { CreateCampaignForm } from "../components/forms/CreateCampaignForm";
import { AuthenticationForm } from "../components/forms/AuthenticationForm";
import { CampaignList } from "../components/lists/CampaignList";
import {
  AnimatedCard,
  AnimatedCountUp,
  FloatingElements,
} from "../components/AnimationComponents";
import { RealtimeUpdates } from "../components/RealtimeUpdates";
import { ZKRankingSystem } from "../components/ZKRankingSystem";
import { EnhancedCampaignGrid } from "../components/EnhancedCampaignGrid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Loader, FullPageLoader, LoadingState } from "../components/ui/loader";
import {
  Wallet,
  LogOut,
  Settings,
  ArrowLeft,
  Shield,
  Zap,
  Users,
  Globe,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  Sparkles,
  Lock,
  Eye,
} from "lucide-react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface User {
  id: string;
  walletAddress: string;
  username: string;
  email: string;
  role: "donor" | "organizer" | "both";
  profile: {
    name?: string;
    bio?: string;
    organization?: string;
  };
  stats: {
    eventsCreated: number;
    donationsMade: number;
    totalRaised: number;
    totalDonated: number;
    eventsSupported: number;
    activeCampaigns: number;
    reputation: number;
  };
  displayName: string;
  canCreateEvents?: boolean;
  canDonate?: boolean;
}

interface Event {
  _id: string;
  eventId: string;
  name: string;
  description: string;
  organizer: string;
  organizerAddress: string;
  organizerInfo?: User;
  milestones: number[];
  milestoneNames: string[];
  currentMilestone: number;
  isActive: boolean;
  createdAt: string;
  totalCommitments?: number;
  totalAmount?: number;
  uniqueDonors?: number;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  category: string;
  ranking: {
    score: number;
    views: number;
    likes: number;
    totalDonations: number;
    uniqueDonors: number;
    avgDonation: number;
  };
  metadata: {
    category:
      | "charity"
      | "technology"
      | "education"
      | "healthcare"
      | "environment"
      | "arts"
      | "sports"
      | "other";
    tags: string[];
    imageUrl?: string;
    socialLinks?: {
      website?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
}

export default function HomePage() {
  const router = useRouter();
  const {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sessionToken,
    signer,
  } = useWallet();

  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // ZK Configuration
  const zkConfig = getZKConfig();
  const zkModeInfo = getZKModeInfo();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // App state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // UI state
  const [currentView, setCurrentView] = useState<
    "public" | "auth" | "donor" | "organizer" | "create" | "contribute"
  >("public");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Session persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem("festfund_user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(
        "festfund_events_cache",
        JSON.stringify({
          events,
          timestamp: Date.now(),
        })
      );
    }
  }, [events]);

  // Restore cached data on load
  useEffect(() => {
    const cachedUser = localStorage.getItem("festfund_user");
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        setIsLoggedIn(true);
        // Set appropriate view based on user role
        if (userData.role === "organizer" || userData.role === "both") {
          setCurrentView("organizer");
        } else {
          setCurrentView("donor");
        }
      } catch (error) {
        console.error("Failed to restore user data:", error);
        localStorage.removeItem("festfund_user");
      }
    }

    const cachedData = localStorage.getItem("festfund_events_cache");
    if (cachedData) {
      try {
        const { events: cachedEvents, timestamp } = JSON.parse(cachedData);
        // Use cached data if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setEvents(cachedEvents);
        }
      } catch (error) {
        console.error("Failed to restore cached data:", error);
      }
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserSpecificData();
    }
  }, [user]);

  // Load appropriate events when view changes
  useEffect(() => {
    if (currentView === "organizer" && user) {
      // Load organizer's specific events
      loadUserSpecificData();
    } else if (currentView === "donor" && user) {
      // Load all events for donor view
      loadInitialData();
    }
  }, [currentView, user]);

  // Auto-refresh data every 30 seconds when user is active
  useEffect(() => {
    if (currentView !== "public" && user) {
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing campaign data...");
        if (currentView === "organizer") {
          loadUserSpecificData();
        } else {
          loadInitialData();
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentView, user]);

  // GSAP animations for enhanced landing page
  useEffect(() => {
    if (currentView === "public") {
      // Hero animations
      if (heroRef.current) {
        const timeline = gsap.timeline();

        timeline
          .from(".hero-title", {
            y: 100,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
          })
          .from(
            ".hero-subtitle",
            {
              y: 50,
              opacity: 0,
              duration: 0.8,
              ease: "power3.out",
            },
            "-=0.5"
          )
          .from(
            ".hero-buttons",
            {
              y: 30,
              opacity: 0,
              duration: 0.6,
              ease: "power3.out",
            },
            "-=0.3"
          )
          .from(
            ".hero-stats",
            {
              scale: 0.8,
              opacity: 0,
              duration: 0.8,
              ease: "back.out(1.7)",
            },
            "-=0.2"
          );
      }

      // Floating animation for hero background
      gsap.to(".floating-shape", {
        y: "+=20",
        rotation: "+=5",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });

      // Stats counter animation on scroll
      if (statsRef.current) {
        ScrollTrigger.create({
          trigger: statsRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.from(".stat-card", {
              scale: 0.8,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.7)",
            });
          },
        });
      }
    }
  }, [currentView]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [eventsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/proof/events`),
      ]);

      setEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      // Don't show error toast for campaigns - fail silently
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSpecificData = async () => {
    if (!user) return;

    try {
      if (user.role === "organizer" || user.role === "both") {
        console.log("🔍 Loading organizer events for:", user.walletAddress);
        const eventsRes = await axios.get(
          `${BACKEND_URL}/api/proof/events/organizer/${user.walletAddress}`
        );

        if (eventsRes.data.success) {
          console.log(
            "✅ Organizer events loaded:",
            eventsRes.data.events.length
          );
          // Update events state with organizer's events for "Your Campaigns" view
          setEvents(eventsRes.data.events || []);
        }
      }

      if (user.role === "donor" || user.role === "both") {
        const commitmentsRes = await axios.get(
          `${BACKEND_URL}/api/proof/commitments/donor/${user.walletAddress}`
        );
        // Handle donor commitments
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  // Fixed authentication flow with proper timing
  const handleConnectWallet = async (): Promise<boolean> => {
    try {
      const result = await connectWallet();
      return result;
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
      return false;
    }
  };

  const handleAuth = async (credentials: {
    username: string;
    email?: string;
    role?: string;
  }): Promise<boolean> => {
    if (!isConnected || !account) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      setAuthLoading(true);

      // Add delay to prevent double-click issues
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate signature for authentication
      const message = `FestFund Authentication\nTimestamp: ${Date.now()}\nWallet: ${account}`;
      const signature = await signer?.signMessage(message);

      if (!signature) {
        toast.error("Failed to sign authentication message");
        return false;
      }

      const endpoint = authMode === "login" ? "login" : "register";
      const payload = {
        walletAddress: account,
        signature,
        message,
        username: credentials.username,
        ...(authMode === "register" && {
          email: credentials.email || `${credentials.username}@example.com`,
          role: credentials.role || "donor",
        }),
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/auth/${endpoint}`,
        payload
      );

      if (response.data.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);

        // Store auth tokens
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        if (response.data.sessionToken) {
          localStorage.setItem("sessionToken", response.data.sessionToken);
        }
        localStorage.setItem("walletAddress", account);

        // Set appropriate view based on user role
        if (
          response.data.user.role === "organizer" ||
          response.data.user.role === "both"
        ) {
          setCurrentView("organizer");
        } else {
          setCurrentView("donor");
        }

        toast.success(
          `${authMode === "login" ? "Login" : "Registration"} successful!`
        );
        return true;
      } else {
        toast.error(
          response.data.message ||
            `${authMode === "login" ? "Login" : "Registration"} failed`
        );
        return false;
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(
        error.response?.data?.message ||
          `${authMode === "login" ? "Login" : "Registration"} failed`
      );
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateCampaign = async (campaignData: any): Promise<boolean> => {
    if (!user || !isConnected) {
      toast.error("Please login to create a campaign");
      return false;
    }

    try {
      setLoading(true);

      const payload = {
        ...campaignData,
        organizer: user.username,
        organizerAddress: account,
        milestones: campaignData.milestones,
        metadata: {
          category: campaignData.category,
          tags: campaignData.tags || [],
          imageUrl: campaignData.imageUrl,
          socialLinks: {
            website: campaignData.website,
            twitter: campaignData.twitter,
            linkedin: campaignData.linkedin,
          },
        },
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/proof/events`,
        payload
      );

      if (response.data.success) {
        toast.success("Campaign created successfully!");
        await loadInitialData(); // Refresh campaigns
        setCurrentView("organizer"); // Return to organizer dashboard
        return true;
      } else {
        toast.error(response.data.message || "Failed to create campaign");
        return false;
      }
    } catch (error: any) {
      console.error("Create campaign error:", error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentView("public");

    // Clear stored data
    localStorage.removeItem("festfund_user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("walletAddress");

    // Disconnect wallet
    disconnectWallet();

    toast.success("Logged out successfully");
  };

  const handleCampaignSelect = (campaign: Event) => {
    // Navigate to dynamic event page
    router.push(`/events/${campaign.eventId}`);
  };

  const handleContribute = (campaignId: string) => {
    const campaign = events.find((e) => e._id === campaignId);
    if (campaign) {
      setSelectedEvent(campaign);
      setCurrentView("contribute");
    }
  };

  const renderHeader = () => (
    <div className="bg-black/95 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Enhanced Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FestFund</h1>
              <p className="text-xs text-gray-400">
                Zero-Knowledge Fundraising
              </p>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="flex items-center space-x-4">
            {currentView !== "public" && (
              <Button
                variant="ghost"
                onClick={() => setCurrentView("public")}
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            )}

            {isLoggedIn && user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {user.profile?.name || user.username}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {user.role} Mode
                  </div>
                </div>

                {user.role === "both" ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentView(
                        currentView === "organizer" ? "donor" : "organizer"
                      )
                    }
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                  >
                    Switch to{" "}
                    {currentView === "organizer" ? "Donor" : "Organizer"}
                  </Button>
                ) : null}

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  size="sm"
                  className="text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              currentView !== "auth" && (
                <Button
                  onClick={() => {
                    setAuthMode("login");
                    setCurrentView("auth");
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect & Login
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case "public":
        return (
          <div className="min-h-screen bg-black relative overflow-hidden">
            <FloatingElements />

            {/* Floating Background Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="floating-shape absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full opacity-30"></div>
              <div className="floating-shape absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full opacity-40"></div>
              <div className="floating-shape absolute bottom-32 left-32 w-40 h-40 bg-cyan-500/10 rounded-full opacity-25"></div>
              <div className="floating-shape absolute bottom-20 right-20 w-28 h-28 bg-green-500/10 rounded-full opacity-20"></div>
            </div>

            {/* Hero Section */}
            <section ref={heroRef} className="relative z-10 pt-20 pb-16 px-4">
              <div className="max-w-6xl mx-auto text-center">
                {/* Hero Title */}
                <div className="hero-title mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                      Powered by Midnight Network
                    </Badge>
                  </div>
                  <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-gray-100 to-blue-100 bg-clip-text text-transparent leading-tight">
                    FestFund
                  </h1>
                  <div className="text-3xl md:text-4xl font-semibold text-white mt-2">
                    Privacy-First Fundraising
                  </div>
                </div>

                {/* Hero Subtitle */}
                <div className="hero-subtitle mb-8 max-w-3xl mx-auto">
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Experience the future of crowdfunding with{" "}
                    <span className="font-semibold text-blue-400">
                      zero-knowledge proofs
                    </span>
                    , complete donor privacy, and transparent milestone
                    verification. Built on cutting-edge cryptography with real
                    Midnight Network integration.
                  </p>
                </div>

                {/* Hero Buttons */}
                <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg group border-0"
                    onClick={() => router.push("/campaigns")}
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Explore Campaigns
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-600 text-white hover:bg-white hover:text-black px-8 py-4 text-lg group bg-transparent"
                    onClick={() => {
                      setAuthMode("register");
                      setCurrentView("auth");
                    }}
                  >
                    <Target className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Get Started
                  </Button>
                </div>

                {/* Hero Stats */}
                <div className="hero-stats grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  <AnimatedCard
                    direction="scale"
                    className="text-center bg-gray-900/50 backdrop-blur-sm border border-gray-800"
                  >
                    <div className="p-4">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        <AnimatedCountUp
                          end={47.8}
                          decimals={1}
                          suffix=" ETH"
                        />
                      </div>
                      <div className="text-sm text-gray-400">Total Raised</div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard
                    direction="scale"
                    delay={0.1}
                    className="text-center bg-gray-900/50 backdrop-blur-sm border border-gray-800"
                  >
                    <div className="p-4">
                      <div className="text-3xl font-bold text-purple-400 mb-1">
                        <AnimatedCountUp end={events.length} />
                      </div>
                      <div className="text-sm text-gray-400">
                        Active Campaigns
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard
                    direction="scale"
                    delay={0.2}
                    className="text-center bg-gray-900/50 backdrop-blur-sm border border-gray-800"
                  >
                    <div className="p-4">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">
                        <AnimatedCountUp end={234} />
                      </div>
                      <div className="text-sm text-gray-400">
                        Privacy Donors
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard
                    direction="scale"
                    delay={0.3}
                    className="text-center bg-gray-900/50 backdrop-blur-sm border border-gray-800"
                  >
                    <div className="p-4">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        <AnimatedCountUp end={1567} />
                      </div>
                      <div className="text-sm text-gray-400">ZK Proofs</div>
                    </div>
                  </AnimatedCard>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 relative z-10">
              <div className="max-w-6xl mx-auto">
                <AnimatedCard direction="up" className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Powered by Zero-Knowledge Technology
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Experience true privacy without sacrificing transparency
                    through cryptographic innovation
                  </p>
                </AnimatedCard>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  <AnimatedCard direction="up" delay={0.1}>
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-white">
                          Complete Privacy
                        </h3>
                        <p className="text-gray-300">
                          Donation amounts stay completely private using real
                          zero-knowledge proofs. Get recognition without
                          revealing sensitive financial information.
                        </p>
                      </CardContent>
                    </Card>
                  </AnimatedCard>

                  <AnimatedCard direction="up" delay={0.2}>
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-white">
                          Full Transparency
                        </h3>
                        <p className="text-gray-300">
                          Campaign progress is cryptographically verified and
                          publicly auditable. Trust through mathematics, not
                          blind faith.
                        </p>
                      </CardContent>
                    </Card>
                  </AnimatedCard>

                  <AnimatedCard direction="up" delay={0.3}>
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-white">
                          Lightning Fast
                        </h3>
                        <p className="text-gray-300">
                          Generate ZK proofs in ~1ms using Midnight Network
                          infrastructure. Privacy at the speed of light.
                        </p>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </div>
              </div>
            </section>

            {/* Featured Campaigns */}
            {events.length > 0 && (
              <section className="py-16 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                  <AnimatedCard direction="up" className="mb-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-white mb-4">
                        Featured Campaigns
                      </h2>
                      <p className="text-xl text-gray-300">
                        Support innovative projects with complete donation
                        privacy
                      </p>
                    </div>
                  </AnimatedCard>

                  <LoadingState
                    isLoading={loading}
                    fallback={
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 animate-pulse"
                          >
                            <div className="h-4 bg-gray-700 rounded mb-3"></div>
                            <div className="h-3 bg-gray-700 rounded mb-2 w-3/4"></div>
                            <div className="h-3 bg-gray-700 rounded mb-4 w-1/2"></div>
                            <div className="h-2 bg-gray-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <EnhancedCampaignGrid
                      campaigns={events.slice(0, 6).map((event) => ({
                        eventId: event.eventId,
                        name: event.name,
                        description: event.description,
                        organizer: event.organizer,
                        targetAmount: event.targetAmount,
                        currentAmount: event.currentAmount || 0,
                        isActive: event.isActive,
                        endDate: event.deadline || "2025-12-31",
                        category: event.metadata?.category || "other",
                        donorCount: event.uniqueDonors || 0,
                        milestones: event.milestones,
                        achievements: 0,
                        privacyLevel: "high" as const,
                        zkProofsGenerated: event.totalCommitments || 0,
                        featured: true,
                        tags: event.metadata?.tags || [],
                      }))}
                      viewMode="grid"
                      showFilters={false}
                    />
                  </LoadingState>

                  <AnimatedCard direction="up" className="text-center mt-8">
                    <Button
                      size="lg"
                      onClick={() => router.push("/campaigns")}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      View All Campaigns
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </AnimatedCard>
                </div>
              </section>
            )}

            {/* Platform Stats */}
            <section ref={statsRef} className="py-16 px-4 relative z-10">
              <div className="max-w-6xl mx-auto">
                <AnimatedCard direction="up" className="mb-12">
                  <h2 className="text-3xl font-bold text-center text-white mb-8">
                    Platform Metrics
                  </h2>
                </AnimatedCard>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="stat-card">
                    <Card className="text-center group hover:shadow-xl transition-all duration-300 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8">
                        <Shield className="w-12 h-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          <AnimatedCountUp end={98.7} decimals={1} suffix="%" />
                        </div>
                        <div className="text-white">Privacy Score</div>
                        <div className="text-sm text-gray-400 mt-2">
                          Cryptographically verified
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="stat-card">
                    <Card className="text-center group hover:shadow-xl transition-all duration-300 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8">
                        <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          <AnimatedCountUp end={99.9} decimals={1} suffix="%" />
                        </div>
                        <div className="text-white">Network Uptime</div>
                        <div className="text-sm text-gray-400 mt-2">
                          Midnight Network reliability
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="stat-card">
                    <Card className="text-center group hover:shadow-xl transition-all duration-300 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8">
                        <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          ~1ms
                        </div>
                        <div className="text-white">ZK Proof Speed</div>
                        <div className="text-sm text-gray-400 mt-2">
                          Lightning-fast privacy
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <AnimatedCard direction="up">
                  <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-12 text-white">
                    <Award className="w-16 h-16 mx-auto mb-6 text-purple-400" />
                    <h2 className="text-4xl font-bold mb-4">
                      Ready to Experience Privacy-First Fundraising?
                    </h2>
                    <p className="text-xl mb-8 text-gray-300">
                      Join the revolution in transparent, private, and trustless
                      crowdfunding
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                        onClick={() => router.push("/campaigns")}
                      >
                        Start Exploring
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 px-8 py-4 text-lg"
                        onClick={() => {
                          setAuthMode("register");
                          setCurrentView("auth");
                        }}
                      >
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            </section>
          </div>
        );

      case "auth":
        return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <AuthenticationForm
                isLogin={authMode === "login"}
                onSubmit={handleAuth}
                onToggleMode={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
                isLoading={authLoading}
                walletConnected={isConnected}
                onConnectWallet={handleConnectWallet}
              />
            </div>
          </div>
        );

      case "donor":
        if (!user) {
          setCurrentView("public");
          return null;
        }
        return (
          <DonorDashboard
            user={user}
            events={events}
            onDiscoverEvents={() => setCurrentView("public")}
            onViewEvent={(eventId: string) => {
              const event = events.find((e) => e.eventId === eventId);
              if (event) handleCampaignSelect(event);
            }}
          />
        );

      case "organizer":
        if (!user) {
          setCurrentView("public");
          return null;
        }
        return (
          <OrganizerDashboard
            user={user}
            events={events.filter((e) => e.organizerAddress === account)}
            onCreateEvent={() => setCurrentView("create")}
            onEditEvent={(eventId: string) => {
              const event = events.find((e) => e.eventId === eventId);
              if (event) {
                setSelectedEvent(event);
                setCurrentView("create"); // Could be a separate edit view
              }
            }}
          />
        );

      case "create":
        return (
          <div className="min-h-screen bg-black p-4">
            <div className="max-w-4xl mx-auto py-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Create New Campaign
                </h2>
                <p className="text-gray-400">
                  Launch your zero-knowledge fundraising campaign with
                  privacy-preserving donation tracking
                </p>
              </div>
              <CreateCampaignForm
                onSubmit={handleCreateCampaign}
                isLoading={loading}
              />
            </div>
          </div>
        );

      case "contribute":
        if (!selectedEvent) {
          setCurrentView("public");
          return null;
        }
        return (
          <div className="min-h-screen bg-black p-4">
            <div className="max-w-4xl mx-auto py-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Contribute to {selectedEvent.name}
                </h2>
                <p className="text-gray-400">
                  Make a privacy-preserving donation using zero-knowledge proofs
                </p>
              </div>
              <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800">
                <CardContent className="p-8">
                  <PrivateCommitmentForm
                    eventId={selectedEvent.eventId}
                    eventName={selectedEvent.name}
                    milestones={selectedEvent.milestones}
                    currentMilestone={selectedEvent.currentMilestone}
                    targetAmount={selectedEvent.targetAmount}
                    currentAmount={selectedEvent.currentAmount}
                    organizerAddress={selectedEvent.organizerAddress}
                    onPaymentComplete={async (
                      txHash: string,
                      amount: string
                    ) => {
                      toast.success(
                        `Payment successful! Amount: ${amount} ETH`
                      );

                      // Refresh the specific event data to show updated totals
                      try {
                        const eventResponse = await axios.get(
                          `${BACKEND_URL}/api/proof/events`
                        );
                        if (eventResponse.data.success) {
                          setEvents(eventResponse.data.events || []);

                          // Update the selected event with new data
                          const updatedEvent = eventResponse.data.events.find(
                            (e: any) => e.eventId === selectedEvent.eventId
                          );
                          if (updatedEvent) {
                            setSelectedEvent(updatedEvent);
                          }
                        }
                      } catch (error) {
                        console.error("Failed to refresh event data:", error);
                      }

                      // Return to appropriate view
                      setCurrentView(
                        user?.role === "donor" ? "donor" : "public"
                      );
                      loadInitialData();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return renderContent();
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {renderHeader()}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-800 bg-[size:20px_20px] opacity-10 pointer-events-none"></div>
        {renderContent()}
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-gray-900 text-white shadow-lg border border-gray-700",
          duration: 4000,
        }}
      />
    </div>
  );
}
