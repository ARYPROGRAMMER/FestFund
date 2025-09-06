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
    console.log("handleWalletConnect called", { walletConnecting, walletConnected });
    
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

    if (!walletConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!credentials.username) {
      setError("Please enter a username");
      return;
    }

    if (!isLogin && !credentials.email) {
      setError("Please enter your email address");
      return;
    }

    if (!isLogin && !credentials.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      // Add a small delay to prevent double-click issues
      await new Promise((resolve) => setTimeout(resolve, 300));

      const success = await onSubmit({
        ...credentials,
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
    <Card className="bg-white dark:bg-slate-800 shadow-xl max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl justify-center">
          <Shield className="w-6 h-6 text-purple-600" />
          {isLogin ? "Login" : "Register"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Success!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Step 1: Connect Wallet
            </h3>

            {!walletConnected && (
              <Alert>
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
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Step 2: {isLogin ? "Sign Message to Login" : "Create Account"}
            </h3>

            {isLogin && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Secure Login</AlertTitle>
                <AlertDescription>
                  You'll be asked to sign a message with your wallet to verify
                  your identity. No password required!
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium block mb-2">Username</label>
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
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium block mb-2">
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
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  We'll use this for important notifications about your
                  campaigns
                </p>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="text-sm font-medium block mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("donor")}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRole === "donor"
                        ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500"
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
                        ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500"
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
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="ghost"
              onClick={onToggleMode}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-700"
            >
              {isLogin ? "Create new account" : "Login instead"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
