const mongoose = require("mongoose");

const commitmentSchema = new mongoose.Schema(
  {
    // ZK-specific fields
    commitmentHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nullifierHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    zkMode: {
      type: String,
      enum: ["own-keys", "midnight-network"],
      required: true,
    },

    // Event context
    eventId: {
      type: String,
      required: true,
      index: true,
    },

    // Proof data (structured differently for each mode)
    proof: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    publicSignals: [String],

    // Transaction tracking
    txHash: {
      type: String,
      required: true,
      index: true,
    },
    blockNumber: Number,

    // Network metadata
    network: {
      type: String,
      required: true,
    }, // 'self-hosted', 'midnight', etc.
    networkId: String, // 'TestNet', 'MainNet', 'local'
    rpcUrl: String,

    // Verification status
    verified: {
      type: Boolean,
      default: false,
    },
    verificationTime: Date,

    // Privacy metadata (never store actual amounts!)
    donorAddress: String, // Optional: for public leaderboards (if desired)

    // Reveal mechanism for funding progress
    isRevealed: {
      type: Boolean,
      default: false,
    },
    revealedAmount: {
      type: String, // Store as string to preserve precision
    },
    revealTimestamp: {
      type: Date,
    },

    // Legacy compatibility fields
    amount: String, // For backward compatibility

    // Midnight-specific fields
    midnightTxHash: String,
    midnightBlockNumber: Number,
    midnightNetworkId: String,

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying
commitmentSchema.index({ eventId: 1, timestamp: -1 });
commitmentSchema.index({ zkMode: 1 });
commitmentSchema.index({ network: 1 });
commitmentSchema.index({ verified: 1 });

// Virtual for checking if commitment is from Midnight Network
commitmentSchema.virtual("isMidnightNetwork").get(function () {
  return this.zkMode === "midnight-network";
});

// Virtual for checking if commitment is verified
commitmentSchema.virtual("isVerified").get(function () {
  return this.verified === true;
});

// Instance method to verify commitment
commitmentSchema.methods.verify = function () {
  this.verified = true;
  this.verificationTime = new Date();
  return this.save();
};

// Static method to find commitments by event
commitmentSchema.statics.findByEvent = function (eventId) {
  return this.find({ eventId }).sort({ timestamp: -1 });
};

// Static method to find commitments by ZK mode
commitmentSchema.statics.findByZkMode = function (zkMode) {
  return this.find({ zkMode }).sort({ timestamp: -1 });
};

// Static method to check if nullifier is used
commitmentSchema.statics.isNullifierUsed = function (nullifierHash) {
  return this.findOne({ nullifierHash }).then((doc) => !!doc);
};

module.exports = mongoose.model("Commitment", commitmentSchema);
