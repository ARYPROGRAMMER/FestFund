const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    organizer: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Allow either Ethereum address format (0x + 40 hex chars) or username
          return /^0x[a-fA-F0-9]{40}$/.test(v) || /^[a-zA-Z0-9_-]{3,30}$/.test(v);
        },
        message: 'Organizer must be a valid Ethereum address (0x + 40 hex chars) or username (3-30 alphanumeric characters)'
      }
    },
    organizerName: {
      type: String,
      maxlength: 100,
    },
    milestones: [
      {
        type: Number,
        required: true,
        min: 0,
      },
    ],
    milestoneNames: [
      {
        type: String,
        maxlength: 100,
      },
    ],
    currentMilestone: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalCommitments: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    uniqueDonors: {
      type: Number,
      default: 0,
    },
    ranking: {
      score: {
        type: Number,
        default: 0,
      },
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "cancelled"],
      default: "active",
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deadline: {
      type: Date,
    },
    metadata: {
      category: {
        type: String,
        enum: [
          "charity",
          "technology",
          "education",
          "healthcare",
          "environment",
          "arts",
          "sports",
          "other",
        ],
        default: "other",
      },
      tags: [String],
      imageUrl: String,
      socialLinks: {
        website: String,
        twitter: String,
        linkedin: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ organizer: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ "metadata.category": 1 });
EventSchema.index({ "ranking.score": -1 });
EventSchema.index({ totalAmount: -1 });
EventSchema.index({ createdAt: -1 });
EventSchema.index({ deadline: 1 });

// Virtual field for frontend compatibility
EventSchema.virtual("organizerAddress").get(function () {
  return this.organizer;
});

// Ensure virtual fields are serialized
EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

// Calculate ranking score based on donations, donors, and engagement
EventSchema.methods.updateRanking = function () {
  const ageInDays = Math.max(
    1,
    (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)
  );
  const donationScore = this.totalAmount * 10;
  const diversityScore = this.uniqueDonors * 50;
  const engagementScore = this.ranking.views * 0.1 + this.ranking.likes * 5;
  const timeDecay = Math.pow(0.95, ageInDays); // Slight decay over time

  this.ranking.score = Math.round(
    (donationScore + diversityScore + engagementScore) * timeDecay
  );
  return this.save();
};

module.exports = mongoose.model("Event", EventSchema);
