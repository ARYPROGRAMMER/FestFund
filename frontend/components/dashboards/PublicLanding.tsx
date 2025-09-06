import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Globe,
  Calendar,
  Star,
  UserPlus,
  LogIn,
  Sparkles,
  Shield,
  Heart,
  Target,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  Lock,
  Eye,
  Zap,
  Gift,
  ArrowRight,
  CheckCircle,
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

interface PublicLandingProps {
  events: Event[];
  onLogin: () => void;
  onRegister: () => void;
  onViewEvent: (eventId: string) => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  events,
  onLogin,
  onRegister,
  onViewEvent,
}) => {
  const totalRaised = events.reduce(
    (sum, event) => sum + (event.totalAmount || 0),
    0
  );
  const totalDonors = events.reduce(
    (sum, event) => sum + (event.uniqueDonors || 0),
    0
  );
  const activeEvents = events.filter((event) => event.status === "active");
  const featuredEvents = events.slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]" />

        <div className="relative text-center py-20 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Floating Icons Animation */}
            <div className="absolute top-10 left-10 animate-bounce">
              <Shield className="w-8 h-8 text-purple-400 opacity-60" />
            </div>
            <div className="absolute top-20 right-16 animate-pulse">
              <Heart className="w-6 h-6 text-pink-400 opacity-60" />
            </div>
            <div className="absolute bottom-16 left-20 animate-bounce delay-1000">
              <Zap className="w-7 h-7 text-blue-400 opacity-60" />
            </div>

            {/* Main Hero Content */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Sparkles className="w-10 h-10 text-purple-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FestFund
              </h1>
            </div>

            <p className="text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Privacy-First Fundraising Revolution
            </p>

            <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              The world's first zero-knowledge fundraising platform. Make
              anonymous donations, support causes you care about, and maintain
              complete privacy while ensuring transparency through cryptographic
              proofs.
            </p>

            {/* Wallet Mode Indicator */}
            <div className="flex justify-center mb-8">
              <Badge 
                variant={process.env.NEXT_PUBLIC_USE_MOCK_WALLET === "true" ? "secondary" : "default"}
                className="px-4 py-2 text-sm font-medium"
              >
                {process.env.NEXT_PUBLIC_USE_MOCK_WALLET === "true" ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Mock Wallet Mode (Testing)
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Real Wallet Mode (MetaMask Required)
                  </>
                )}
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={onRegister}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Start Donating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={onLogin}
                variant="outline"
                className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20 px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <LogIn className="w-5 h-5 mr-2" />I Have an Account
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>100% Anonymous</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Zero-Knowledge Proofs</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <span>Transparent & Verifiable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              Privacy Protected
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Your donations are completely anonymous using advanced
              zero-knowledge cryptography. No one can trace donations back to
              you.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              Fully Transparent
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              All donations are publicly verifiable on the blockchain while
              maintaining donor privacy through cryptographic proofs.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              Instant & Secure
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Donations are processed instantly on the blockchain with the
              highest security standards and minimal transaction fees.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Platform Statistics */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
            Making Impact Together
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Join thousands of donors and organizers who trust FestFund for
            secure, anonymous fundraising
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <DollarSign className="w-8 h-8 text-emerald-100" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {totalRaised.toFixed(2)} ETH
              </div>
              <div className="text-emerald-100 font-medium">Total Raised</div>
              <div className="text-xs text-emerald-200 mt-1">
                Verified on blockchain
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Users className="w-8 h-8 text-blue-100" />
              </div>
              <div className="text-3xl font-bold mb-2">{totalDonors}</div>
              <div className="text-blue-100 font-medium">Anonymous Donors</div>
              <div className="text-xs text-blue-200 mt-1">
                Privacy protected
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Calendar className="w-8 h-8 text-purple-100" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {activeEvents.length}
              </div>
              <div className="text-purple-100 font-medium">
                Active Campaigns
              </div>
              <div className="text-xs text-purple-200 mt-1">
                Live fundraising
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-orange-500 to-red-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Shield className="w-8 h-8 text-orange-100" />
              </div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-orange-100 font-medium">
                Privacy Protected
              </div>
              <div className="text-xs text-orange-200 mt-1">
                Zero-knowledge proofs
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Featured Campaigns */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
            Featured Campaigns
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Support meaningful causes and make a difference while maintaining
            your privacy
          </p>
        </div>

        {featuredEvents.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                No Campaigns Yet
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Be the first to create a campaign on our revolutionary
                privacy-first platform!
              </p>
              <Button
                onClick={onRegister}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create First Campaign
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <Card
                key={event.eventId}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-white dark:bg-slate-800 overflow-hidden"
                onClick={() => onViewEvent(event.eventId)}
              >
                {event.metadata?.imageUrl ? (
                  <div
                    className="h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{
                      backgroundImage: `url(${event.metadata.imageUrl})`,
                    }}
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Heart className="w-16 h-16 text-white opacity-80" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium">
                      {event.metadata.category}
                    </Badge>
                    <Badge
                      variant={
                        event.status === "active" ? "default" : "secondary"
                      }
                      className={
                        event.status === "active"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      }
                    >
                      {event.status === "active" ? "Live" : "Completed"}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Raised</span>
                      <span className="font-semibold text-emerald-600">
                        {(event.totalAmount || 0).toFixed(3)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Target</span>
                      <span className="font-semibold">
                        {event.targetAmount.toFixed(3)} ETH
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((event.totalAmount || 0) / event.targetAmount) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.uniqueDonors || 0} donors
                      </span>
                      <span className="text-purple-600 font-medium group-hover:text-purple-700">
                        View Details →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
