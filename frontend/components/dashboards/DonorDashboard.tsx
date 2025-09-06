import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Heart,
  Shield,
  DollarSign,
  Users,
  Globe,
  TrendingUp,
  Eye,
  Star,
  Award,
  Calendar,
  Target,
} from "lucide-react";

interface Event {
  eventId: string;
  name: string;
  description: string;
  totalAmount?: number;
  uniqueDonors?: number;
  targetAmount: number;
  status: string;
  createdAt: string;
  organizerAddress: string;
  ranking: {
    score: number;
    views: number;
    likes: number;
  };
  metadata: {
    category: string;
    tags: string[];
    imageUrl?: string;
  };
}

interface User {
  id: string;
  walletAddress: string;
  username: string;
  email: string;
  role: "donor" | "organizer" | "both";
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
}

interface DonorDashboardProps {
  user: User;
  events: Event[];
  onDiscoverEvents: () => void;
  onViewEvent: (eventId: string) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  user,
  events,
  onDiscoverEvents,
  onViewEvent,
}) => {
  // For demonstration, we'll use the user stats
  // In a real app, you'd fetch actual donation history
  const recentDonations = events.slice(0, 3); // Mock recent events the user might have donated to

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Donor Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Welcome back, {user.displayName}! Thank you for your generosity.
            </p>
          </div>
        </div>
        <Button
          onClick={onDiscoverEvents}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
        >
          <Globe className="w-4 h-4 mr-2" />
          Discover Campaigns
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {user.stats.donationsMade || 0}
                </h3>
                <p className="text-green-100">Donations Made</p>
              </div>
              <Heart className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {(user.stats.totalDonated || 0).toFixed(2)} ETH
                </h3>
                <p className="text-blue-100">Total Donated</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {user.stats.eventsSupported || 0}
                </h3>
                <p className="text-purple-100">Campaigns Supported</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {user.stats.reputation || 0}
                </h3>
                <p className="text-orange-100">Privacy Score</p>
              </div>
              <Shield className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ZK Privacy Stats */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Shield className="w-5 h-5" />
            Zero-Knowledge Privacy Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Privacy Protected
              </div>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {user.stats.donationsMade || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Anonymous Donations
              </div>
            </div>
            <div className="text-center p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Identity Protection
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Recent Campaign Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentDonations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2 text-slate-600 dark:text-slate-300">
                Start Making a Difference
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Discover amazing campaigns and make your first anonymous
                donation!
              </p>
              <Button
                onClick={onDiscoverEvents}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                <Globe className="w-4 h-4 mr-2" />
                Explore Campaigns
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDonations.map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">
                        {event.name}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {event.metadata.category} • {event.uniqueDonors || 0}{" "}
                        donors
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-slate-800 dark:text-white">
                        {Math.round(
                          ((event.totalAmount || 0) / event.targetAmount) * 100
                        )}
                        %
                      </div>
                      <div className="text-sm text-slate-500">
                        {(event.totalAmount || 0).toFixed(2)} /{" "}
                        {event.targetAmount} ETH
                      </div>
                    </div>
                    <Badge
                      variant={
                        event.status === "active" ? "default" : "secondary"
                      }
                      className={
                        event.status === "active" ? "bg-green-500" : ""
                      }
                    >
                      {event.status === "active" ? "Active" : "Completed"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewEvent(event.eventId)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
