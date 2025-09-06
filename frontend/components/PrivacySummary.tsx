import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Key, 
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Globe,
  Users
} from 'lucide-react';

interface PrivacySummaryProps {
  donationCount: number;
  isPrivate?: boolean;
  zkProofGenerated?: boolean;
  midnightNetworkStatus?: 'connected' | 'disconnected' | 'pending';
  anonymousRanking?: number;
  privacyLevel: 'high' | 'medium' | 'low';
  onPrivacyToggle?: () => void;
}

export const PrivacySummary: React.FC<PrivacySummaryProps> = ({
  donationCount,
  isPrivate = true,
  zkProofGenerated = false,
  midnightNetworkStatus = 'connected',
  anonymousRanking,
  privacyLevel = 'high',
  onPrivacyToggle
}) => {
  const getPrivacyLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-yellow-500 to-amber-600';
      case 'low':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getPrivacyLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Shield className="w-5 h-5 text-green-600" />;
      case 'medium':
        return <Eye className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <EyeOff className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'disconnected':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-xl border-0">
      <CardHeader className={`bg-gradient-to-r ${getPrivacyLevelColor(privacyLevel)} text-white rounded-t-lg`}>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold">Privacy Protection</div>
            <div className="text-white/80 text-sm font-normal">
              Zero-knowledge donation privacy
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Privacy Level Overview */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getPrivacyLevelIcon(privacyLevel)}
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                Privacy Level: {privacyLevel.charAt(0).toUpperCase() + privacyLevel.slice(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {privacyLevel === 'high' && 'Maximum anonymity with ZK proofs'}
                {privacyLevel === 'medium' && 'Partial privacy with some exposure'}
                {privacyLevel === 'low' && 'Minimal privacy protection'}
              </div>
            </div>
          </div>
          
          {onPrivacyToggle && (
            <button
              onClick={onPrivacyToggle}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isPrivate ? 'Private' : 'Public'}</span>
            </button>
          )}
        </div>

        {/* Privacy Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ZK Proof Status */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              {zkProofGenerated ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium text-gray-900 dark:text-white">
                ZK Proof Generation
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {zkProofGenerated 
                ? 'Your donation is cryptographically private'
                : 'Waiting for proof generation...'
              }
            </div>
          </div>

          {/* Midnight Network Status */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Midnight Network
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${getNetworkStatusColor(midnightNetworkStatus)} border-0`}>
                {midnightNetworkStatus === 'connected' && 'Connected'}
                {midnightNetworkStatus === 'pending' && 'Connecting...'}
                {midnightNetworkStatus === 'disconnected' && 'Disconnected'}
              </Badge>
              {midnightNetworkStatus === 'connected' && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  • TestNet-02
                </span>
              )}
            </div>
          </div>

          {/* Anonymous Ranking */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Anonymous Ranking
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {anonymousRanking 
                ? `Rank #${anonymousRanking} (identity protected)`
                : 'Not ranked yet'
              }
            </div>
          </div>

          {/* Donation Privacy */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Donation Count
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {donationCount} private {donationCount === 1 ? 'donation' : 'donations'}
            </div>
          </div>
        </div>

        {/* Privacy Protection Features */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Privacy Protection Features
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Zero-Knowledge Proofs
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Prove donation validity without revealing amounts or identity
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-purple-900 dark:text-purple-100">
                  Midnight Network Integration
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Leveraging privacy-first blockchain infrastructure for enhanced anonymity
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-green-900 dark:text-green-100">
                  Cryptographic Commitments
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Secure commitment schemes protect donor information while enabling verification
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                Complete Privacy Guarantee
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Your donation amounts, wallet addresses, and personal information remain completely 
                private while still contributing to transparent campaign progress. Only you and the 
                cryptographic proof system know your contribution details.
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        {onPrivacyToggle && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Privacy Mode
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Control your donation visibility
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Public</span>
                <button
                  onClick={onPrivacyToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPrivate ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Private</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
