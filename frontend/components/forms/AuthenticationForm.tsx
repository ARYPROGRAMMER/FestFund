import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Wallet,
  Shield,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

interface AuthenticationFormProps {
  isLogin: boolean;
  onSubmit: (credentials: {
    username: string;
    email?: string;
    role?: string;
  }) => Promise<boolean>;
  onToggleMode: () => void;
  isLoading: boolean;
  walletConnected: boolean;
  onConnectWallet: () => Promise<boolean>;
}

export const AuthenticationForm: React.FC<AuthenticationFormProps> = ({
  isLogin,
  onSubmit,
  onToggleMode,
  isLoading,
  walletConnected,
  onConnectWallet,
}) => {
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
  });
  const [selectedRole, setSelectedRole] = useState("donor");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [walletConnecting, setWalletConnecting] = useState(false);

  const handleWalletConnect = async () => {
    console.log("handleWalletConnect called", {
      walletConnecting,
      walletConnected,
    });

    if (walletConnecting || walletConnected) return;

    setWalletConnecting(true);
    setError("");

    try {
      // Add a small delay to prevent double-click issues
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("Calling onConnectWallet...");
      const success = await onConnectWallet();
      console.log("onConnectWallet result:", success);

      if (success) {
        setSuccess("Wallet connected successfully!");
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
    } catch (error: any) {
      console.error("Wallet connection error in form:", error);
      setError(error.message || "Wallet connection failed");
    } finally {
      setWalletConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Enhanced validation
    if (!walletConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!credentials.username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (credentials.username.trim().length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (credentials.username.trim().length > 20) {
      setError("Username must be less than 20 characters");
      return;
    }

    // Username validation - alphanumeric and underscore only
    if (!/^[a-zA-Z0-9_]+$/.test(credentials.username.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (!isLogin) {
      if (!credentials.email.trim()) {
        setError("Please enter your email address");
        return;
      }

      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email.trim())) {
        setError("Please enter a valid email address");
        return;
      }

      if (!selectedRole) {
        setError("Please select an account type");
        return;
      }
    }

    try {
      // Add a small delay to prevent double-click issues
      await new Promise((resolve) => setTimeout(resolve, 300));

      const success = await onSubmit({
        username: credentials.username.trim(),
        email: credentials.email.trim(),
        role: selectedRole,
      });
      if (success) {
        setSuccess(`${isLogin ? "Login" : "Registration"} successful!`);
        setCredentials({ username: "", email: "" });
      }
    } catch (error: any) {
      setError(error.message || `${isLogin ? "Login" : "Registration"} failed`);
    }
  };

  return (
    <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700 shadow-2xl max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl justify-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          <Shield className="w-6 h-6 text-purple-400" />
          {isLogin ? "Login" : "Register"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert className="bg-red-900/20 border-red-700 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/20 border-green-700 text-green-400">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">Success!</AlertTitle>
              <AlertDescription className="text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">
              Step 1: Connect Wallet
            </h3>

            {!walletConnected && (
              <Alert className="bg-blue-900/20 border-blue-700 text-blue-400">
                <Info className="h-4 w-4" />
                <AlertTitle>Wallet Required</AlertTitle>
                <AlertDescription>
                  You need to connect your wallet to continue with{" "}
                  {isLogin ? "login" : "registration"}.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleWalletConnect}
              disabled={walletConnecting || walletConnected}
              className={`w-full ${
                walletConnected
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              } text-white`}
            >
              {walletConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting Wallet...
                </>
              ) : walletConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Wallet Connected
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Step 2: {isLogin ? "Sign Message to Login" : "Create Account"}
            </h3>

            {isLogin && (
              <Alert className="bg-blue-900/20 border-blue-700 text-blue-400">
                <Info className="h-4 w-4" />
                <AlertTitle>Secure Login</AlertTitle>
                <AlertDescription>
                  You'll be asked to sign a message with your wallet to verify
                  your identity. No password required!
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">
                Username
              </label>
              <Input
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                disabled={isLoading || !walletConnected}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  disabled={isLoading || !walletConnected}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll use this for important notifications about your
                  campaigns
                </p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("donor")}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRole === "donor"
                        ? "border-purple-500 bg-purple-900/20 text-purple-300"
                        : "border-gray-600 hover:border-gray-500 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    disabled={isLoading || !walletConnected}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Donor</div>
                      <div className="text-xs opacity-70">
                        Support events & causes
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("organizer")}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRole === "organizer"
                        ? "border-purple-500 bg-purple-900/20 text-purple-300"
                        : "border-gray-600 hover:border-gray-500 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    disabled={isLoading || !walletConnected}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Organizer</div>
                      <div className="text-xs opacity-70">
                        Create & manage events
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              disabled={isLoading || !walletConnected}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing Message..." : "Creating Account..."}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {isLogin ? "Sign to Login" : "Create Account"}
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="ghost"
              onClick={onToggleMode}
              disabled={isLoading}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            >
              {isLogin ? "Create new account" : "Login instead"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
