import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

import {
  Eye,
  EyeOff,
  User,
  UserX,
  Shield,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface PrivacyPreferencesProps {
  currentPreferences?: {
    revealAmount: boolean;
    revealName: boolean;
    customDisplayName?: string;
  };
  onPreferencesChange: (preferences: {
    revealAmount: boolean;
    revealName: boolean;
    customDisplayName?: string;
  }) => void;
  isLoading?: boolean;
}

export const PrivacyPreferences: React.FC<PrivacyPreferencesProps> = ({
  currentPreferences = {
    revealAmount: false,
    revealName: false,
    customDisplayName: "",
  },
  onPreferencesChange,
  isLoading = false,
}) => {
  const [preferences, setPreferences] = useState(currentPreferences);

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    onPreferencesChange(newPreferences);
  };

  const getPrivacyScore = () => {
    let score = 100;
    if (preferences.revealAmount) score -= 30;
    if (preferences.revealName) score -= 20;
    return score;
  };

  const getPrivacyLevel = () => {
    const score = getPrivacyScore();
    if (score >= 90) return { level: "Maximum", color: "green" };
    if (score >= 70) return { level: "High", color: "blue" };
    if (score >= 50) return { level: "Medium", color: "yellow" };
    return { level: "Low", color: "red" };
  };

  const privacyLevel = getPrivacyLevel();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Settings className="w-5 h-5" />
          Privacy Preferences
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge
            className={`px-3 py-1 bg-${privacyLevel.color}-100 text-${privacyLevel.color}-800 border border-${privacyLevel.color}-200`}
          >
            <Shield className="w-3 h-3 mr-1" />
            {privacyLevel.level} Privacy ({getPrivacyScore()}%)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Privacy Explanation */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How Rankings Work</p>
              <p>
                Your donations are ranked by ZK-proven amounts for accuracy, but
                you control what information is publicly visible on the
                leaderboard.
              </p>
            </div>
          </div>
        </div>

        {/* Amount Revelation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.revealAmount ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-purple-600" />
              )}
              <div>
                <Label className="text-base font-medium">
                  Reveal Donation Amount
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show your actual donation amount on the leaderboard
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.revealAmount}
              onCheckedChange={(checked) =>
                handlePreferenceChange("revealAmount", checked)
              }
              disabled={isLoading}
            />
          </div>
          {preferences.revealAmount && (
            <div className="ml-8 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                <CheckCircle className="w-4 h-4" />
                Your donation amount will be visible to all users
              </div>
            </div>
          )}
        </div>

        {/* Name Revelation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.revealName ? (
                <User className="w-5 h-5 text-green-600" />
              ) : (
                <UserX className="w-5 h-5 text-purple-600" />
              )}
              <div>
                <Label className="text-base font-medium">Reveal Identity</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show your wallet address or custom name on the leaderboard
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.revealName}
              onCheckedChange={(checked) =>
                handlePreferenceChange("revealName", checked)
              }
              disabled={isLoading}
            />
          </div>
          {preferences.revealName && (
            <div className="ml-8 space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <CheckCircle className="w-4 h-4" />
                  Your identity will be visible to all users
                </div>
              </div>
              <div>
                <Label htmlFor="customName" className="text-sm font-medium">
                  Custom Display Name (Optional)
                </Label>
                <Input
                  id="customName"
                  value={preferences.customDisplayName || ""}
                  onChange={(e) =>
                    handlePreferenceChange("customDisplayName", e.target.value)
                  }
                  placeholder="Enter a custom name for the leaderboard"
                  maxLength={50}
                  disabled={isLoading}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to show your wallet address
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
          <h4 className="font-medium mb-3">Your Privacy Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ranking accuracy:</span>
              <span className="font-medium text-green-600">
                ✓ Always accurate (ZK-proven)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amount visibility:</span>
              <span
                className={`font-medium ${
                  preferences.revealAmount
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {preferences.revealAmount ? "Public" : "Private"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Identity visibility:</span>
              <span
                className={`font-medium ${
                  preferences.revealName ? "text-yellow-600" : "text-green-600"
                }`}
              >
                {preferences.revealName ? "Public" : "Anonymous"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Overall Privacy Score:</span>
              <span className={`font-bold text-${privacyLevel.color}-600`}>
                {getPrivacyScore()}% ({privacyLevel.level})
              </span>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Important</p>
              <p>
                These preferences can be changed at any time. Your ranking
                position is always accurate regardless of what you choose to
                reveal.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
