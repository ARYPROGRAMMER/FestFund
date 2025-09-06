const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserSession = require("../models/UserSession");
const {
  verifySignature,
  validateMessageTimestamp,
} = require("../utils/signatureVerification");
const router = express.Router();

// Connect wallet and create session
router.post("/connect", async (req, res) => {
  try {
    const { walletAddress, chainId, metadata } = req.body;

    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address",
      });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Remove any existing sessions for this wallet
    await UserSession.deleteMany({ walletAddress });

    // Create new session
    const session = new UserSession({
      walletAddress,
      sessionToken,
      metadata: {
        ...metadata,
        chainId,
        ipAddress: req.ip,
      },
    });

    await session.save();

    res.json({
      success: true,
      sessionToken,
      walletAddress,
      message: "Session created successfully",
    });
  } catch (error) {
    console.error("Connect error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
});

// Verify session
router.post("/verify", async (req, res) => {
  try {
    const { sessionToken, walletAddress } = req.body;

    if (!sessionToken || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Session token and wallet address required",
      });
    }

    const session = await UserSession.findOne({
      sessionToken,
      walletAddress,
      isConnected: true,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    // Update last activity
    await session.updateActivity();

    res.json({
      success: true,
      walletAddress: session.walletAddress,
      preferences: session.preferences,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({
      success: false,
      message: "Session verification failed",
    });
  }
});

// Update activity
router.post("/activity", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: "Session token required",
      });
    }

    const session = await UserSession.findOne({
      sessionToken,
      isConnected: true,
    });

    if (session) {
      await session.updateActivity();
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Activity update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update activity",
    });
  }
});

// Disconnect wallet
router.post("/disconnect", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: "Session token required",
      });
    }

    const session = await UserSession.findOne({ sessionToken });

    if (session) {
      await session.logout();
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// Get user preferences
router.get("/preferences/:sessionToken", async (req, res) => {
  try {
    const { sessionToken } = req.params;

    const session = await UserSession.findOne({
      sessionToken,
      isConnected: true,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    res.json({
      success: true,
      preferences: session.preferences,
      walletAddress: session.walletAddress,
    });
  } catch (error) {
    console.error("Preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get preferences",
    });
  }
});

// Update user preferences
router.put("/preferences", async (req, res) => {
  try {
    const { sessionToken, preferences } = req.body;

    const session = await UserSession.findOne({
      sessionToken,
      isConnected: true,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    session.preferences = { ...session.preferences, ...preferences };
    await session.save();

    res.json({
      success: true,
      preferences: session.preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
});

// Signature-based registration
router.post("/register", async (req, res) => {
  try {
    const { walletAddress, username, email, role, message, signature } =
      req.body;

    // Validate required fields
    if (
      !walletAddress ||
      !username ||
      !email ||
      !role ||
      !message ||
      !signature
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for registration",
      });
    }

    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address format",
      });
    }

    // Validate message timestamp
    if (!validateMessageTimestamp(message)) {
      return res.status(400).json({
        success: false,
        message: "Authentication message expired. Please try again.",
      });
    }

    // Verify signature
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature. Please sign the message with your wallet.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { walletAddress: walletAddress.toLowerCase() },
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User with this wallet address, email, or username already exists",
      });
    }

    // Create new user
    const user = new User({
      walletAddress: walletAddress.toLowerCase(),
      username,
      email: email.toLowerCase(),
      role,
      profile: {
        name: username,
      },
      authMethod: "signature",
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const session = new UserSession({
      walletAddress: walletAddress.toLowerCase(),
      sessionToken,
      metadata: {
        authMethod: "signature",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.profile.name || user.username,
        stats: user.stats,
      },
      token,
      sessionToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// Signature-based login
router.post("/login", async (req, res) => {
  try {
    const { walletAddress, message, signature } = req.body;

    // Validate required fields
    if (!walletAddress || !message || !signature) {
      return res.status(400).json({
        success: false,
        message: "Wallet address, message, and signature are required",
      });
    }

    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address format",
      });
    }

    // Validate message timestamp
    if (!validateMessageTimestamp(message)) {
      return res.status(400).json({
        success: false,
        message: "Authentication message expired. Please try again.",
      });
    }

    // Verify signature
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature. Please sign the message with your wallet.",
      });
    }

    // Find user
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create or update session
    await UserSession.deleteMany({
      walletAddress: walletAddress.toLowerCase(),
    });

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const session = new UserSession({
      walletAddress: walletAddress.toLowerCase(),
      sessionToken,
      metadata: {
        authMethod: "signature",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await session.save();

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.profile.name || user.username,
        stats: user.stats,
      },
      token,
      sessionToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Get current user data
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          email: user.email,
          role: user.role,
          displayName: user.profile.name || user.username,
          stats: user.stats,
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
    });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      await UserSession.deleteOne({ sessionToken });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

module.exports = router;
