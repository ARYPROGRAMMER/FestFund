const express = require("express");
const router = express.Router();
const Achievement = require("../models/Achievement");
const Event = require("../models/Event");
const achievementService = require("../services/achievementService");

/**
 * GET /api/achievements/:eventId
 * Get all achievements for a campaign
 */
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { unlocked_only } = req.query;
    
    const achievements = await achievementService.getCampaignAchievements(
      eventId, 
      unlocked_only !== 'true'
    );
    
    res.json({
      success: true,
      achievements,
      total: achievements.length,
      unlocked: achievements.filter(a => a.isUnlocked).length,
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch achievements",
    });
  }
});

/**
 * POST /api/achievements/:eventId/check
 * Check and unlock achievements for a campaign
 */
router.post("/:eventId/check", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get current event data
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    const unlockedAchievements = await achievementService.checkAndUnlockAchievements(event);
    
    res.json({
      success: true,
      unlockedAchievements,
      newUnlocks: unlockedAchievements.length,
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check achievements",
    });
  }
});

/**
 * POST /api/achievements/:eventId/generate
 * Generate achievements for a campaign (admin/organizer only)
 */
router.post("/:eventId/generate", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get event data
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }
    
    // Check if achievements already exist
    const existingAchievements = await Achievement.find({ eventId });
    if (existingAchievements.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Achievements already exist for this campaign",
        existing: existingAchievements.length,
      });
    }
    
    const achievements = await achievementService.generateCampaignAchievements(event);
    
    res.json({
      success: true,
      achievements,
      generated: achievements.length,
    });
  } catch (error) {
    console.error("Error generating achievements:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate achievements",
    });
  }
});

/**
 * GET /api/achievements/:eventId/stats
 * Get achievement statistics for a campaign
 */
router.get("/:eventId/stats", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const achievements = await Achievement.find({ eventId });
    const unlocked = achievements.filter(a => a.isUnlocked);
    const byType = {};
    const byPriority = {};
    
    achievements.forEach(achievement => {
      byType[achievement.type] = (byType[achievement.type] || 0) + 1;
      byPriority[achievement.priority] = (byPriority[achievement.priority] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: {
        total: achievements.length,
        unlocked: unlocked.length,
        pending: achievements.length - unlocked.length,
        completionRate: achievements.length > 0 ? (unlocked.length / achievements.length * 100).toFixed(1) : 0,
        byType,
        byPriority,
        recentUnlocks: unlocked
          .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
          .slice(0, 5)
          .map(a => ({
            title: a.title,
            unlockedAt: a.unlockedAt,
            type: a.type,
          })),
      },
    });
  } catch (error) {
    console.error("Error fetching achievement stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch achievement statistics",
    });
  }
});

/**
 * PATCH /api/achievements/:achievementId
 * Update an achievement (admin only)
 */
router.patch("/:achievementId", async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { title, description, icon, priority, isVisible } = req.body;
    
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: "Achievement not found",
      });
    }
    
    // Update allowed fields
    if (title) achievement.title = title;
    if (description) achievement.description = description;
    if (icon) achievement.icon = icon;
    if (priority !== undefined) achievement.priority = Math.min(Math.max(priority, 1), 5);
    if (isVisible !== undefined) achievement.isVisible = isVisible;
    
    await achievement.save();
    
    res.json({
      success: true,
      achievement,
    });
  } catch (error) {
    console.error("Error updating achievement:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update achievement",
    });
  }
});

module.exports = router;
