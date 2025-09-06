const Event = require("../models/Event");
const Commitment = require("../models/CommitmentNew");
const achievementService = require("./achievementService");

/**
 * Update event statistics and check achievements
 */
async function updateEventStatsAndAchievements(eventId) {
  try {
    console.log(`📊 Updating stats and checking achievements for event: ${eventId}`);
    
    // Get event and commitments
    const [event, commitments] = await Promise.all([
      Event.findOne({ eventId }),
      Commitment.find({ eventId })
    ]);

    if (!event) {
      console.error(`Event not found: ${eventId}`);
      return null;
    }

    // Calculate current statistics
    const revealedCommitments = commitments.filter(c => c.isRevealed && c.revealedAmount);
    const totalRevealedAmount = revealedCommitments.reduce(
      (sum, c) => sum + parseFloat(c.revealedAmount || "0"), 
      0
    );
    
    const uniqueDonors = new Set(
      revealedCommitments.map(c => c.donorAddress.toLowerCase())
    ).size;

    // Update event statistics
    const oldTotalAmount = event.totalAmount || 0;
    const oldUniqueDonors = event.uniqueDonors || 0;
    
    event.totalAmount = totalRevealedAmount;
    event.uniqueDonors = uniqueDonors;
    event.totalCommitments = commitments.length;
    event.lastActivity = new Date();

    // Update current milestone based on total amount
    let currentMilestone = 0;
    for (let i = 0; i < event.milestones.length; i++) {
      if (totalRevealedAmount >= event.milestones[i]) {
        currentMilestone = i + 1;
      } else {
        break;
      }
    }
    event.currentMilestone = currentMilestone;

    // Update ranking score
    await event.updateRanking();
    await event.save();

    // Check for newly unlocked achievements
    const unlockedAchievements = await achievementService.checkAndUnlockAchievements(event);
    
    // Log significant changes
    if (totalRevealedAmount !== oldTotalAmount) {
      console.log(`💰 ${event.name}: Total amount updated from $${oldTotalAmount} to $${totalRevealedAmount}`);
    }
    
    if (uniqueDonors !== oldUniqueDonors) {
      console.log(`👥 ${event.name}: Unique donors updated from ${oldUniqueDonors} to ${uniqueDonors}`);
    }

    if (unlockedAchievements.length > 0) {
      console.log(`🏆 ${event.name}: Unlocked ${unlockedAchievements.length} new achievements!`);
      unlockedAchievements.forEach(achievement => {
        console.log(`   • ${achievement.title}`);
      });
    }

    return {
      event,
      stats: {
        totalAmount: totalRevealedAmount,
        uniqueDonors,
        totalCommitments: commitments.length,
        currentMilestone,
      },
      unlockedAchievements,
    };
  } catch (error) {
    console.error("Error updating event stats and achievements:", error);
    return null;
  }
}

/**
 * Check achievements for all active campaigns
 */
async function checkAllActiveAchievements() {
  try {
    const activeEvents = await Event.find({ status: "active" });
    console.log(`🔍 Checking achievements for ${activeEvents.length} active campaigns...`);
    
    const results = [];
    for (const event of activeEvents) {
      const result = await updateEventStatsAndAchievements(event.eventId);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error checking all active achievements:", error);
    return [];
  }
}

module.exports = {
  updateEventStatsAndAchievements,
  checkAllActiveAchievements,
};
