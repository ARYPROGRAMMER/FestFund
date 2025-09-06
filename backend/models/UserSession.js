const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      match: /^0x[a-fA-F0-9]{40}$/,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        default: "en",
      },
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      chainId: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-cleanup expired sessions (24 hours)
userSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

userSessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

userSessionSchema.methods.logout = function () {
  this.isConnected = false;
  return this.save();
};

module.exports = mongoose.model("UserSession", userSessionSchema);
