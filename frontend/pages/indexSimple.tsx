import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { motion, useAnimation, useInView } from "framer-motion";
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
  DollarSign,
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

  // Platform metrics state
  const [platformMetrics, setPlatformMetrics] = useState({
    totalRaised: 0,
    activeCampaigns: 0,
    totalDonors: 0,
    zkProofsGenerated: 0,
    totalCommitments: 0,
    avgDonation: 0,
    isLoading: true,
    lastUpdated: null as Date | null,
  });

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
        const sessionToken = localStorage.getItem("sessionToken");
        
        // Only restore if we have a valid session token
        if (sessionToken) {
          setUser(userData);
          setIsLoggedIn(true);
          
          // Set authentication cookies for middleware
          document.cookie = `wallet-connected=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          document.cookie = `user-role=${userData.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          document.cookie = `sessionToken=${sessionToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          
          // Set appropriate view based on user role
          if (userData.role === "organizer" || userData.role === "both") {
            setCurrentView("organizer");
          } else {
            setCurrentView("donor");
          }
        } else {
          // Clear cached user data if no session token
          localStorage.removeItem("festfund_user");
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

  // Redirect authenticated users away from public landing page
  useEffect(() => {
    if (isLoggedIn && user && currentView === "public") {
      if (user.role === "organizer" || user.role === "both") {
        setCurrentView("organizer");
      } else {
        setCurrentView("donor");
      }
    }
  }, [isLoggedIn, user, currentView]);

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
      // Load all events for donor view, plus user-specific data
      Promise.all([loadInitialData(), loadUserSpecificData()]);
    } else if (currentView === "public") {
      // Load all events for public view
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

  // Auto-refresh metrics for public view every 10 seconds
  useEffect(() => {
    if (currentView === "public") {
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing platform metrics...");
        loadInitialData();
      }, 10000); // 10 seconds for public metrics

      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Animation trigger for public view
  useEffect(() => {
    // Animations are now handled by Framer Motion components
    // No additional setup needed here
  }, [currentView]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setPlatformMetrics((prev) => ({ ...prev, isLoading: true }));

      const [eventsRes, metricsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/proof/events`),
        axios
          .get(`${BACKEND_URL}/api/proof/metrics`)
          .catch(() => ({ data: { success: false } })),
      ]);

      const eventsList = eventsRes.data.events || [];
      setEvents(eventsList);

      // Calculate metrics from events data if API endpoint doesn't exist
      let metrics = {
        totalRaised: 0,
        activeCampaigns: 0,
        totalDonors: 0,
        zkProofsGenerated: 0,
        totalCommitments: 0,
        avgDonation: 0,
        isLoading: false,
      };

      if (metricsRes.data.success) {
        // Use API metrics if available
        metrics = { ...metrics, ...metricsRes.data.metrics };
      } else {
        // Calculate from events data
        const activeEvents = eventsList.filter((e: Event) => e.isActive);
        metrics.totalRaised = eventsList.reduce(
          (sum: number, event: Event) => sum + (event.currentAmount || 0),
          0
        );
        metrics.activeCampaigns = activeEvents.length;
        metrics.totalDonors = eventsList.reduce(
          (sum: number, event: Event) => sum + (event.uniqueDonors || 0),
          0
        );
        metrics.zkProofsGenerated = eventsList.reduce(
          (sum: number, event: Event) => sum + (event.totalCommitments || 0),
          0
        );
        metrics.totalCommitments = metrics.zkProofsGenerated;
        metrics.avgDonation =
          metrics.totalDonors > 0
            ? metrics.totalRaised / metrics.totalDonors
            : 0;
      }

      setPlatformMetrics({ ...metrics, lastUpdated: new Date() });
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setEvents([]);
      setPlatformMetrics((prev) => ({ ...prev, isLoading: false }));
    } finally {
      setLoading(false);
    }
  };

  const loadUserSpecificData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (user.role === "organizer" || user.role === "both") {
        console.log("🔍 Loading organizer events for:", user.walletAddress);

        // Load organizer's specific events
        const eventsRes = await axios.get(
          `${BACKEND_URL}/api/proof/events/organizer/${user.walletAddress}`
        );

        if (eventsRes.data.success) {
          console.log(
            "✅ Organizer events loaded:",
            eventsRes.data.events.length
          );

          // For organizer view, we want to show their events primarily
          // but also keep all events for context if needed
          const organizerEvents = eventsRes.data.events || [];

          // If we're in organizer view, prioritize organizer's events
          if (currentView === "organizer") {
            setEvents(organizerEvents);
          } else {
            // For other views, merge organizer events with existing events
            setEvents((prevEvents) => {
              const organizerEventIds = new Set(
                organizerEvents.map((e: any) => e.eventId)
              );
              const otherEvents = prevEvents.filter(
                (e) => !organizerEventIds.has(e.eventId)
              );
              return [...organizerEvents, ...otherEvents];
            });
          }
        } else {
          // If the organizer-specific endpoint fails, filter from all events
          console.log(
            "⚠️ Organizer endpoint failed, filtering from all events"
          );
          await loadInitialData(); // Load all events as fallback
        }
      }

      if (user.role === "donor" || user.role === "both") {
        // Load donor commitments for donor dashboard
        try {
          const commitmentsRes = await axios.get(
            `${BACKEND_URL}/api/proof/commitments/donor/${user.walletAddress}`
          );
          // Handle donor commitments if needed
          console.log("📊 Donor commitments loaded");
        } catch (error) {
          console.error("Failed to load donor commitments:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      // Fallback to loading all events
      await loadInitialData();
    } finally {
      setLoading(false);
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
          // Set session cookie for middleware
          document.cookie = `sessionToken=${response.data.sessionToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        localStorage.setItem("walletAddress", account);
        
        // Set authentication cookies for middleware
        document.cookie = `wallet-connected=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `user-role=${response.data.user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

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
    
    // Clear authentication cookies for middleware
    document.cookie = "wallet-connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

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
    <div className="bg-black/95 backdrop-blur-sm border-b border-gray-700/70 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Enhanced Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-sm">
                FestFund
              </h1>
              <p className="text-xs text-gray-300 font-medium">
                Zero-Knowledge Fundraising
              </p>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="flex items-center space-x-4">
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
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
            {/* Enhanced Background with Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10"></div>

            {/* Animated Grid Pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "50px 50px",
              }}
            ></div>

            {/* Enhanced Floating Background Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {/* Large Background Blurs */}
              <motion.div
                className="floating-shape absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/8 to-cyan-500/4 rounded-full blur-3xl"
                animate={{
                  y: [0, 15, 0],
                  x: [0, 5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-purple-500/8 to-pink-500/4 rounded-full blur-3xl"
                animate={{
                  y: [0, -12, 0],
                  x: [0, -4, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 1,
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute -bottom-40 -left-20 w-72 h-72 bg-gradient-to-br from-green-500/8 to-emerald-500/4 rounded-full blur-3xl"
                animate={{
                  y: [0, 10, 0],
                  x: [0, 8, 0],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 2,
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute -bottom-20 -right-40 w-88 h-88 bg-gradient-to-br from-violet-500/8 to-indigo-500/4 rounded-full blur-3xl"
                animate={{
                  y: [0, -8, 0],
                  x: [0, -6, 0],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 3,
                }}
              ></motion.div>

              {/* Medium Accent Shapes */}
              <motion.div
                className="floating-shape absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-500/6 to-transparent rounded-full"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-500/6 to-transparent rounded-full"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 2,
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full"
                animate={{
                  scale: [1, 1.06, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 3,
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-br from-green-500/5 to-transparent rounded-full"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 1,
                }}
              ></motion.div>

              {/* Small Sparkle Effects */}
              <motion.div
                className="floating-shape absolute top-1/3 left-1/4 w-3 h-3 bg-white/15 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute top-2/3 right-1/3 w-2 h-2 bg-blue-400/20 rounded-full"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 0.1, 0.4],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 2,
                }}
              ></motion.div>
              <motion.div
                className="floating-shape absolute bottom-1/3 left-2/3 w-2 h-2 bg-purple-400/20 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.05, 0.3],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 4,
                }}
              ></motion.div>
            </div>

            {/* Hero Section - Elevated z-index */}
            <section ref={heroRef} className="relative z-40 pt-32 pb-24 px-4">
              <div className="max-w-7xl mx-auto text-center relative z-50">
                {/* Badge */}
                <motion.div
                  className="hero-badge mb-8"
                  initial={{ y: -15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-blue-100">
                      Powered by Midnight Network
                    </span>
                  </div>
                </motion.div>

                {/* Main Title */}
                <motion.div
                  className="hero-title mb-12"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                >
                  <h1 className="text-7xl md:text-8xl lg:text-9xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-[0.9] mb-6 tracking-tight">
                    FestFund
                  </h1>
                  <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/90 mb-8 tracking-wide">
                    Privacy-First Fundraising
                  </div>
                </motion.div>

                {/* Hero Subtitle */}
                <motion.div
                  className="hero-subtitle mb-12 max-w-4xl mx-auto"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                >
                  <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
                    Experience the future of crowdfunding with{" "}
                    <span className="font-semibold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                      zero-knowledge proofs
                    </span>
                    , complete donor privacy, and transparent milestone
                    verification.
                  </p>
                </motion.div>

                {/* Hero Buttons - Enhanced */}
                <motion.div
                  className="hero-buttons mb-16"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
                >
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-lg mx-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg font-semibold group border-0 shadow-2xl hover:shadow-blue-500/25 hover:scale-[1.01] transition-all duration-300 rounded-2xl min-w-[200px]"
                      onClick={() => router.push("/campaigns")}
                    >
                      <Play className="w-5 h-5 mr-3 group-hover:scale-105 transition-transform" />
                      Explore Campaigns
                      <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white hover:text-black px-12 py-6 text-lg font-semibold group bg-white/5 backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 rounded-2xl shadow-xl hover:shadow-white/10 min-w-[200px]"
                      onClick={() => {
                        setAuthMode("register");
                        setCurrentView("auth");
                      }}
                    >
                      <Target className="w-5 h-5 mr-3 group-hover:scale-105 transition-transform" />
                      Get Started
                    </Button>
                  </div>
                </motion.div>

                {/* Hero Stats */}
                <motion.div
                  className="hero-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
                >
                  <AnimatedCard direction="scale" className="group">
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300 hover:scale-[1.01] shadow-xl hover:shadow-blue-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <DollarSign className="w-10 h-10 text-blue-400 group-hover:scale-105 transition-transform duration-200" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-4xl font-black text-white mb-2">
                          {platformMetrics.isLoading ? (
                            <div className="h-10 bg-blue-400/20 rounded-lg animate-pulse"></div>
                          ) : (
                            <AnimatedCountUp
                              end={platformMetrics.totalRaised}
                              decimals={2}
                              suffix=" ETH"
                            />
                          )}
                        </div>
                        <div className="text-base font-semibold text-blue-200 mb-1">
                          Total Raised
                        </div>
                        <div className="text-sm text-blue-300/70">
                          Across all campaigns
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard direction="scale" delay={0.1} className="group">
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300 hover:scale-[1.01] shadow-xl hover:shadow-purple-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <Target className="w-10 h-10 text-purple-400 group-hover:scale-105 transition-transform duration-300" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-4xl font-black text-white mb-2">
                          {platformMetrics.isLoading ? (
                            <div className="h-10 bg-purple-400/20 rounded-lg animate-pulse"></div>
                          ) : (
                            <AnimatedCountUp
                              end={platformMetrics.activeCampaigns}
                            />
                          )}
                        </div>
                        <div className="text-base font-semibold text-purple-200 mb-1">
                          Active Campaigns
                        </div>
                        <div className="text-sm text-purple-300/70">
                          Currently fundraising
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard direction="scale" delay={0.2} className="group">
                    <div className="relative overflow-hidden bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-400/40 transition-all duration-300 hover:scale-[1.01] shadow-xl hover:shadow-cyan-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <Users className="w-10 h-10 text-cyan-400 group-hover:scale-105 transition-transform duration-300" />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-4xl font-black text-white mb-2">
                          {platformMetrics.isLoading ? (
                            <div className="h-10 bg-cyan-400/20 rounded-lg animate-pulse"></div>
                          ) : (
                            <AnimatedCountUp
                              end={platformMetrics.totalDonors}
                            />
                          )}
                        </div>
                        <div className="text-base font-semibold text-cyan-200 mb-1">
                          Privacy Donors
                        </div>
                        <div className="text-sm text-cyan-300/70">
                          Anonymous contributors
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard direction="scale" delay={0.3} className="group">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 hover:border-green-400/40 transition-all duration-300 hover:scale-[1.01] shadow-xl hover:shadow-green-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <Shield className="w-10 h-10 text-green-400 group-hover:scale-105 transition-transform duration-300" />
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-4xl font-black text-white mb-2">
                          {platformMetrics.isLoading ? (
                            <div className="h-10 bg-green-400/20 rounded-lg animate-pulse"></div>
                          ) : (
                            <AnimatedCountUp
                              end={platformMetrics.zkProofsGenerated}
                            />
                          )}
                        </div>
                        <div className="text-base font-semibold text-green-200 mb-1">
                          ZK Proofs
                        </div>
                        <div className="text-sm text-green-300/70">
                          Privacy guarantees
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>

                  {/* Secondary Metrics */}
                  <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-2">
                        Avg. Donation
                      </div>
                      <div className="text-xl font-bold text-white">
                        {platformMetrics.isLoading ? (
                          <div className="h-6 w-20 bg-gray-600/20 rounded animate-pulse mx-auto"></div>
                        ) : (
                          <AnimatedCountUp
                            end={platformMetrics.avgDonation}
                            decimals={3}
                            suffix=" ETH"
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-2">
                        Success Rate
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {platformMetrics.isLoading ? (
                          <div className="h-6 w-16 bg-gray-600/20 rounded animate-pulse mx-auto"></div>
                        ) : (
                          <AnimatedCountUp end={94.2} decimals={1} suffix="%" />
                        )}
                      </div>
                    </div>

                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-2">
                        Network Status
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full absolute top-0 left-0 animate-ping"></div>
                        </div>
                        <span className="text-xl font-bold text-green-400">
                          Live
                        </span>
                      </div>
                    </div>

                    <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-2">
                        Processing Time
                      </div>
                      <div className="text-xl font-bold text-blue-400">
                        ~1.2ms
                      </div>
                    </div>
                  </div>

                  {/* Last Updated Indicator */}
                  {platformMetrics.lastUpdated && (
                    <div className="md:col-span-2 lg:col-span-4 flex justify-center mt-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/30 rounded-full border border-gray-700/30 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-400">
                          Last updated:{" "}
                          {platformMetrics.lastUpdated.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
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
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
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
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
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
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-900/50 backdrop-blur-sm border-gray-800">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
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
                  <AnimatedCard
                    direction="up"
                    delay={0.1}
                    className="stat-card"
                  >
                    <Card className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg">
                      <CardContent className="p-8">
                        <Shield className="w-12 h-12 text-green-500 mx-auto mb-4 group-hover:scale-105 transition-transform" />
                        <div className="text-3xl font-bold text-green-500 mb-2">
                          <AnimatedCountUp end={98.7} decimals={1} suffix="%" />
                        </div>
                        <div className="text-white font-medium">
                          Privacy Score
                        </div>
                        <div className="text-sm text-gray-300 mt-2">
                          Cryptographically verified
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>

                  <AnimatedCard
                    direction="up"
                    delay={0.2}
                    className="stat-card"
                  >
                    <Card className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg">
                      <CardContent className="p-8">
                        <Globe className="w-12 h-12 text-blue-500 mx-auto mb-4 group-hover:scale-105 transition-transform" />
                        <div className="text-3xl font-bold text-blue-500 mb-2">
                          <AnimatedCountUp end={99.9} decimals={1} suffix="%" />
                        </div>
                        <div className="text-white font-medium">
                          Network Uptime
                        </div>
                        <div className="text-sm text-gray-300 mt-2">
                          Midnight Network reliability
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>

                  <AnimatedCard
                    direction="up"
                    delay={0.3}
                    className="stat-card"
                  >
                    <Card className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg">
                      <CardContent className="p-8">
                        <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4 group-hover:scale-105 transition-transform" />
                        <div className="text-3xl font-bold text-purple-500 mb-2">
                          ~1ms
                        </div>
                        <div className="text-white font-medium">
                          ZK Proof Speed
                        </div>
                        <div className="text-sm text-gray-300 mt-2">
                          Lightning-fast privacy
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
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
            events={events} // Pass all events, let component filter them
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
