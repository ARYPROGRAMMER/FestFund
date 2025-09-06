import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AnimatedCard, AnimatedCountUp } from "./AnimationComponents";

import {
  Activity,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  Bell,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
} from "lucide-react";

interface LiveUpdate {
  id: string;
  type: "donation" | "milestone" | "campaign" | "achievement";
  message: string;
  amount?: number;
  campaignName?: string;
  timestamp: Date;
  zkProof?: boolean;
  anonymous?: boolean;
}

interface RealtimeMetrics {
  activeDonors: number;
  totalRaisedToday: number;
  zkProofsGenerated: number;
  activeCampaigns: number;
  avgDonationSize: number;
  donationsPerMinute: number;
}

export const RealtimeUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeDonors: 0,
    totalRaisedToday: 0,
    zkProofsGenerated: 0,
    activeCampaigns: 0,
    avgDonationSize: 0,
    donationsPerMinute: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    connectWebSocket();

    // Initialize notification sound
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.volume = 0.3;
    }

    // Generate mock updates for demo
    const interval = setInterval(generateMockUpdate, 3000);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearInterval(interval);
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const wsUrl = backendUrl.replace("http", "ws") + "/ws";
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealTimeUpdate(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");

        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setIsConnected(false);
    }
  };

  const handleRealTimeUpdate = (data: any) => {
    if (data.type === "update") {
      addUpdate(data.update);
    } else if (data.type === "metrics") {
      setMetrics(data.metrics);
    }
  };

  const addUpdate = (update: LiveUpdate) => {
    setUpdates((prev) => [update, ...prev.slice(0, 9)]); // Keep only last 10 updates

    // Play notification sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore audio play errors (autoplay policy)
      });
    }

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      zkProofsGenerated: prev.zkProofsGenerated + (update.zkProof ? 1 : 0),
      totalRaisedToday: prev.totalRaisedToday + (update.amount || 0),
    }));
  };

  const generateMockUpdate = () => {
    const mockUpdates: Omit<LiveUpdate, "id" | "timestamp">[] = [
      {
        type: "donation",
        message: "Anonymous donor contributed to Tech Conference 2024",
        amount: Math.random() * 2 + 0.1,
        campaignName: "Tech Conference 2024",
        zkProof: true,
        anonymous: true,
      },
      {
        type: "milestone",
        message: "Community Arts Festival reached 50% funding milestone!",
        campaignName: "Community Arts Festival",
        zkProof: true,
      },
      {
        type: "achievement",
        message: 'Privacy Champion earned "ZK Master" achievement',
        zkProof: true,
      },
      {
        type: "campaign",
        message: 'New campaign "Green Energy Initiative" launched',
        campaignName: "Green Energy Initiative",
      },
    ];

    const randomUpdate =
      mockUpdates[Math.floor(Math.random() * mockUpdates.length)];
    const update: LiveUpdate = {
      ...randomUpdate,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    addUpdate(update);
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "donation":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "milestone":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "achievement":
        return <Zap className="w-4 h-4 text-purple-600" />;
      case "campaign":
        return <Activity className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case "donation":
        return "border-l-green-500 bg-green-50";
      case "milestone":
        return "border-l-blue-500 bg-blue-50";
      case "achievement":
        return "border-l-purple-500 bg-purple-50";
      case "campaign":
        return "border-l-orange-500 bg-orange-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Disconnected
              </>
            )}
          </div>
          <span className="text-sm text-gray-500">Real-time updates</span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-full transition-colors ${
            soundEnabled
              ? "bg-blue-600/20 text-blue-400"
              : "bg-gray-800/50 text-gray-400"
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <AnimatedCard direction="scale">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-600">
                <AnimatedCountUp
                  end={metrics.totalRaisedToday}
                  decimals={2}
                  suffix=" ETH"
                />
              </div>
              <div className="text-xs text-gray-400">Today</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard direction="scale" delay={0.1}>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-600">
                <AnimatedCountUp end={metrics.activeDonors} />
              </div>
              <div className="text-xs text-gray-400">Active Donors</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard direction="scale" delay={0.2}>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-600">
                <AnimatedCountUp end={metrics.zkProofsGenerated} />
              </div>
              <div className="text-xs text-gray-400">ZK Proofs</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard direction="scale" delay={0.3}>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-orange-600">
                <AnimatedCountUp end={metrics.activeCampaigns} />
              </div>
              <div className="text-xs text-gray-400">Campaigns</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard direction="scale" delay={0.4}>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-cyan-600">
                <AnimatedCountUp
                  end={metrics.avgDonationSize}
                  decimals={2}
                  suffix=" ETH"
                />
              </div>
              <div className="text-xs text-gray-400">Avg Donation</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard direction="scale" delay={0.5}>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-4 text-center">
              <Bell className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-pink-600">
                <AnimatedCountUp
                  end={metrics.donationsPerMinute}
                  decimals={1}
                  suffix="/min"
                />
              </div>
              <div className="text-xs text-gray-400">Donation Rate</div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Live Updates Feed */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-blue-600" />
            Live Activity Feed
            <Badge variant="outline" className="ml-auto">
              {updates.length} updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {updates.map((update, index) => (
              <AnimatedCard
                key={update.id}
                direction="left"
                delay={index * 0.05}
              >
                <div
                  className={`p-4 border-l-4 rounded-r-lg ${getUpdateColor(
                    update.type
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getUpdateIcon(update.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {update.message}
                      </p>
                      {update.amount && (
                        <p className="text-sm text-green-600 font-semibold">
                          +{update.amount.toFixed(3)} ETH
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(update.timestamp)}
                        </span>
                        {update.zkProof && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            ZK Verified
                          </Badge>
                        )}
                        {update.anonymous && (
                          <Badge variant="outline" className="text-xs">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}

            {updates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Waiting for live updates...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
