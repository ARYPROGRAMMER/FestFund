const mongoose = require("mongoose");

const AchievementSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      // Remove the strict enum to allow any achievement type
      // This gives more flexibility for dynamic generation
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 300,
    },
    icon: {
      type: String,
      default: "🏆",
    },
    metadata: {
      milestone: Number,
      percentage: Number,
      amount: Number,
      donorCount: Number,
      targetValue: Number,
      currentValue: Number,
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    unlockedAt: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5, // 1 = lowest, 5 = highest
    },
    generatedBy: {
      type: String,
      enum: ['auto', 'gemini', 'manual'],
      default: 'gemini',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AchievementSchema.index({ eventId: 1, type: 1 });
AchievementSchema.index({ eventId: 1, isUnlocked: 1 });
AchievementSchema.index({ eventId: 1, priority: -1 });
AchievementSchema.index({ unlockedAt: -1 });

module.exports = mongoose.model("Achievement", AchievementSchema);
