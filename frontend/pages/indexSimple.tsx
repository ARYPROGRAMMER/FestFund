import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Wallet, LogOut, Settings, ArrowLeft } from "lucide-react";

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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [eventsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/proof/events`),
      ]);

      setEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const loadUserSpecificData = async () => {
    if (!user) return;

    try {
      if (user.role === "organizer" || user.role === "both") {
        const eventsRes = await axios.get(
          `${BACKEND_URL}/api/proof/events/organizer/${user.walletAddress}`
        );
        // Handle organizer events - could update events state or separate organizer events
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
    <div className="bg-white dark:bg-slate-900 shadow-lg border-b border-purple-100 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Enhanced Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                FestFund
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Zero-Knowledge Fundraising</p>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="flex items-center space-x-4">
            {currentView !== "public" && (
              <Button
                variant="ghost"
                onClick={() => setCurrentView("public")}
                className="text-sm hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            )}

            {isLoggedIn && user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.profile?.name || user.username}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role} Mode
                  </div>
                </div>
                
                {user.role === "organizer" || user.role === "both" ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentView(
                        currentView === "organizer" ? "donor" : "organizer"
                      )
                    }
                    size="sm"
                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 transition-all"
                  >
                    Switch to{" "}
                    {currentView === "organizer" ? "Donor" : "Organizer"}
                  </Button>
                ) : null}
                
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  size="sm"
                  className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
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
          <PublicLanding
            events={events}
            onLogin={() => {
              setAuthMode("login");
              setCurrentView("auth");
            }}
            onRegister={() => {
              setAuthMode("register");
              setCurrentView("auth");
            }}
            onViewEvent={(eventId: string) => {
              const event = events.find((e) => e.eventId === eventId);
              if (event) handleCampaignSelect(event);
            }}
          />
        );

      case "auth":
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
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
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto py-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Create New Campaign
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Launch your zero-knowledge fundraising campaign with privacy-preserving donation tracking
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
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto py-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Contribute to {selectedEvent.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Make a privacy-preserving donation using zero-knowledge proofs
                </p>
              </div>
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-8">
                  <PrivateCommitmentForm
                    eventId={selectedEvent.eventId}
                    eventName={selectedEvent.name}
                    milestones={selectedEvent.milestones}
                    currentMilestone={selectedEvent.currentMilestone}
                    targetAmount={selectedEvent.targetAmount}
                    currentAmount={selectedEvent.currentAmount}
                    organizerAddress={selectedEvent.organizerAddress}
                    onPaymentComplete={(txHash: string, amount: string) => {
                      toast.success(
                        `Payment successful! Amount: ${amount} ETH`
                      );
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {renderHeader()}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-20 pointer-events-none"></div>
        {renderContent()}
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg',
          duration: 4000,
        }}
      />
    </div>
  );
}
