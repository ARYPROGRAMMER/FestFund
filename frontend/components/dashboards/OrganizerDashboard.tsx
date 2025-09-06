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
  const userEvents = events.filter(
    (event) => event.organizerAddress === user.walletAddress
  );
  const activeEvents = userEvents.filter((event) => event.status === "active");
  const totalRaised = userEvents.reduce(
    (sum, event) => sum + (event.totalAmount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Organizer Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Welcome back, {user.displayName}!
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateEvent}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{userEvents.length}</h3>
                <p className="text-blue-100">Campaigns Created</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {totalRaised.toFixed(2)} ETH
                </h3>
                <p className="text-green-100">Total Raised</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{activeEvents.length}</h3>
                <p className="text-orange-100">Active Campaigns</p>
              </div>
              <Globe className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {userEvents.reduce(
                    (sum, event) => sum + (event.uniqueDonors || 0),
                    0
                  )}
                </h3>
                <p className="text-purple-100">Total Supporters</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Your Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2 text-slate-600 dark:text-slate-300">
                No Campaigns Yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Create your first fundraising campaign to get started!
              </p>
              <Button
                onClick={onCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userEvents.slice(0, 5).map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">
                        {event.name}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Created {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-slate-800 dark:text-white">
                        {(event.totalAmount || 0).toFixed(2)} ETH
                      </div>
                      <div className="text-sm text-slate-500">
                        {event.uniqueDonors || 0} donors
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
                      onClick={() => onEditEvent(event.eventId)}
                    >
                      <Edit className="w-4 h-4" />
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
