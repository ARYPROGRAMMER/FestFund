import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Target,
  Globe,
  DollarSign,
  Users,
  TrendingUp,
  Heart,
  Shield,
  Plus,
  Edit,
  Star,
  Award,
  Eye,
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";

interface Event {
  eventId: string;
  name: string;
  description: string;
  totalAmount?: number;
  currentAmount?: number;
  uniqueDonors?: number;
  targetAmount: number;
  status: string;
  isActive?: boolean;
  createdAt: string;
  organizerAddress: string;
  deadline?: string;
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

interface OrganizerDashboardProps {
  user: User;
  events: Event[];
  onCreateEvent: () => void;
  onEditEvent: (eventId: string) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  user,
  events,
  onCreateEvent,
  onEditEvent,
}) => {
  // Filter events to show only those created by the logged-in user
  const userEvents = events.filter(
    (event) =>
      event.organizerAddress.toLowerCase() === user.walletAddress.toLowerCase()
  );

  const activeEvents = userEvents.filter(
    (event) => event.status === "active" || event.isActive === true
  );

  const completedEvents = userEvents.filter(
    (event) => event.status === "completed" || event.status === "cancelled"
  );

  const totalRaised = userEvents.reduce(
    (sum, event) => sum + (event.currentAmount || event.totalAmount || 0),
    0
  );

  const totalDonors = userEvents.reduce(
    (sum, event) => sum + (event.uniqueDonors || 0),
    0
  );

  const getStatusColor = (event: Event) => {
    if (event.status === "active" || event.isActive)
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (event.status === "completed")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (event.status === "cancelled")
      return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getProgressPercentage = (event: Event) => {
    const current = event.currentAmount || event.totalAmount || 0;
    const target = event.targetAmount || 1;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-800 bg-[size:20px_20px] opacity-5 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Organizer Dashboard
                </h1>
                <p className="text-lg text-gray-300 mt-1">
                  Welcome back,{" "}
                  <span className="font-semibold text-purple-300">
                    {user.displayName || user.username}
                  </span>
                  !
                </p>
              </div>
            </div>
            <Button
              onClick={onCreateEvent}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Campaign
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    {userEvents.length}
                  </h3>
                  <p className="text-blue-200 font-medium">Total Campaigns</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-[1.02] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    {totalRaised.toFixed(2)} ETH
                  </h3>
                  <p className="text-green-200 font-medium">Total Raised</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-[1.02] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    {activeEvents.length}
                  </h3>
                  <p className="text-purple-200 font-medium">
                    Active Campaigns
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-[1.02] shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    {totalDonors}
                  </h3>
                  <p className="text-orange-200 font-medium">
                    Total Supporters
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {userEvents.length > 0
                  ? (totalRaised / userEvents.length).toFixed(2)
                  : "0.00"}{" "}
                ETH
              </div>
              <div className="text-gray-300 text-sm">Average per Campaign</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {completedEvents.length}
              </div>
              <div className="text-gray-300 text-sm">Completed Campaigns</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {userEvents.length > 0
                  ? Math.round(
                      (completedEvents.length / userEvents.length) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-gray-300 text-sm">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Section */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <Star className="w-6 h-6 text-yellow-400" />
              Your Campaigns
              <Badge
                variant="secondary"
                className="ml-auto bg-gray-700/50 text-gray-300"
              >
                {userEvents.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {userEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  No Campaigns Yet
                </h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                  Ready to make a difference? Create your first fundraising
                  campaign and start reaching your goals with zero-knowledge
                  privacy.
                </p>
                <Button
                  onClick={onCreateEvent}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] px-8 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userEvents.map((event) => {
                  const progress = getProgressPercentage(event);
                  const currentAmount =
                    event.currentAmount || event.totalAmount || 0;

                  return (
                    <div
                      key={event.eventId}
                      className="group p-6 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-gray-600/50 hover:bg-gray-800/50 transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Target className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                                {event.name}
                              </h4>
                              <Badge
                                className={`${getStatusColor(
                                  event
                                )} ml-4 flex-shrink-0`}
                              >
                                {event.status === "active" || event.isActive
                                  ? "Active"
                                  : event.status === "completed"
                                  ? "Completed"
                                  : event.status === "cancelled"
                                  ? "Cancelled"
                                  : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400">
                                  Progress
                                </span>
                                <span className="text-sm font-medium text-white">
                                  {progress.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-700/50 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(progress, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300">
                                  <span className="font-semibold text-white">
                                    {currentAmount.toFixed(2)} ETH
                                  </span>
                                  <span className="text-gray-400">
                                    {" "}
                                    / {event.targetAmount.toFixed(2)} ETH
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-gray-300">
                                  <span className="font-semibold text-white">
                                    {event.uniqueDonors || 0}
                                  </span>{" "}
                                  supporters
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-400" />
                                <span className="text-gray-300">
                                  Created{" "}
                                  {new Date(event.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditEvent(event.eventId)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
