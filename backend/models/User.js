const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    passwordHash: {
      type: String,
      required: function () {
        return this.authMethod !== "signature";
      },
      minlength: 60, // bcrypt hash length
    },
    role: {
      type: String,
      enum: ["donor", "organizer", "both"],
      default: "donor",
      index: true,
    },
    authMethod: {
      type: String,
      enum: ["password", "signature"],
      default: "password",
      index: true,
    },
    profile: {
      name: String,
      bio: String,
      avatar: String,
      organization: String,
      website: String,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      privacy: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
      categories: [String],
    },
    stats: {
      eventsCreated: { type: Number, default: 0 },
      donationsMade: { type: Number, default: 0 },
      totalRaised: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ walletAddress: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ "stats.reputation": -1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual("displayName").get(function () {
  return this.profile.name || this.username;
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Check if user can create events
userSchema.methods.canCreateEvents = function () {
  return this.role === "organizer" || this.role === "both";
};

// Check if user can donate
userSchema.methods.canDonate = function () {
  return this.role === "donor" || this.role === "both";
};

// Static method to find by wallet
userSchema.statics.findByWallet = function (walletAddress) {
  return this.findOne({
    walletAddress: walletAddress.toLowerCase(),
    isActive: true,
  });
};

module.exports = mongoose.model("User", userSchema);
