const { GoogleGenerativeAI } = require("@google/generative-ai");
const Achievement = require("../models/Achievement");

class AchievementGeneratorService {
  constructor() {
    // Initialize Gemini API
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } else {
      console.warn("GEMINI_API_KEY not found, using fallback achievements");
      this.genAI = null;
    }
  }

  /**
   * Generate achievements for a new campaign
   */
  async generateCampaignAchievements(event) {
    try {
      console.log(`Generating achievements for campaign: ${event.name}`);
      
      // Check if achievements already exist for this event
      const existingAchievements = await Achievement.findOne({ eventId: event.eventId });
      if (existingAchievements) {
        console.log(`Achievements already exist for campaign: ${event.name}, skipping generation`);
        return [];
      }
      
      const achievements = [];
      
      // Always add the campaign creation achievement
      achievements.push({
        eventId: event.eventId,
        type: 'campaign_created',
        title: '🚀 Campaign Launched',
        description: `Successfully launched "${event.name}" campaign`,
        icon: '🚀',
        isUnlocked: true,
        unlockedAt: new Date(),
        priority: 5,
        generatedBy: 'auto',
      });

      // Generate dynamic achievements using Gemini API
      if (this.genAI) {
        const geminiAchievements = await this.generateWithGemini(event);
        achievements.push(...geminiAchievements);
      } else {
        // Fallback achievements
        const fallbackAchievements = this.generateFallbackAchievements(event);
        achievements.push(...fallbackAchievements);
      }

      // Save all achievements to database
      const savedAchievements = await Achievement.insertMany(achievements);
      console.log(`Generated ${savedAchievements.length} achievements for ${event.name}`);
      
      return savedAchievements;
    } catch (error) {
      console.error("Error generating campaign achievements:", error);
      return [];
    }
  }

  /**
   * Generate achievements using Gemini AI
   */
  async generateWithGemini(event) {
    try {
      const prompt = this.buildGeminiPrompt(event);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text, event.eventId);
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.generateFallbackAchievements(event);
    }
  }

  /**
   * Build prompt for Gemini API
   */
  buildGeminiPrompt(event) {
    const milestoneInfo = event.milestones.map((m, i) => 
      `Milestone ${i + 1}: $${m} - ${event.milestoneNames[i] || 'Progress milestone'}`
    ).join('\n');

    return `
Generate creative and engaging achievements for a crowdfunding campaign with the following details:

Campaign: "${event.name}"
Description: "${event.description}"
Target Amount: $${event.targetAmount}
Deadline: ${event.deadline ? new Date(event.deadline).toLocaleDateString() : 'No deadline'}
Category: ${event.metadata?.category || 'general'}
Milestones:
${milestoneInfo}

Please generate 8-12 diverse achievements that will motivate donors and track progress. Include achievements for:
1. First donation received
2. Percentage milestones (10%, 25%, 50%, 75%, 90%)
3. Milestone completions
4. Donor count milestones (5, 10, 25, 50 donors)
5. Time-based achievements (halfway to deadline, final week, etc.)
6. Creative campaign-specific achievements based on the description and category

Return ONLY a JSON array with this exact structure:
[
  {
    "type": "first_donation",
    "title": "Short catchy title (max 50 chars)",
    "description": "Engaging description (max 150 chars)",
    "icon": "relevant emoji",
    "priority": 1-5,
    "metadata": {"percentage": 10, "amount": 1000, "donorCount": 5}
  }
]

Make titles creative and descriptions motivating. Use relevant emojis. Priority: 5=most important, 1=nice to have.
`;
  }

  /**
   * Parse Gemini API response
   */
  parseGeminiResponse(responseText, eventId) {
    try {
      // Extract JSON from response (Gemini sometimes adds extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const achievements = JSON.parse(jsonMatch[0]);
      
      return achievements.map(achievement => ({
        eventId,
        type: achievement.type || 'custom',
        title: achievement.title.substring(0, 100),
        description: achievement.description.substring(0, 300),
        icon: achievement.icon || '🏆',
        priority: Math.min(Math.max(achievement.priority || 3, 1), 5),
        metadata: achievement.metadata || {},
        isUnlocked: false,
        generatedBy: 'gemini',
      }));
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      console.log("Raw response:", responseText);
      return [];
    }
  }

  /**
   * Generate fallback achievements if Gemini is unavailable
   */
  generateFallbackAchievements(event) {
    const achievements = [];
    
    // First donation
    achievements.push({
      eventId: event.eventId,
      type: 'first_donation',
      title: '🎯 First Supporter',
      description: 'Received the first donation! The journey begins.',
      icon: '🎯',
      priority: 5,
      generatedBy: 'auto',
    });

    // Percentage milestones
    [10, 25, 50, 75, 90].forEach(percentage => {
      achievements.push({
        eventId: event.eventId,
        type: 'funding_percentage',
        title: `💰 ${percentage}% Funded`,
        description: `Reached ${percentage}% of the funding goal!`,
        icon: percentage >= 75 ? '🔥' : '💰',
        priority: percentage >= 50 ? 4 : 3,
        metadata: { percentage, targetValue: Math.round(event.targetAmount * percentage / 100) },
        generatedBy: 'auto',
      });
    });

    // Donor milestones
    [5, 10, 25, 50].forEach(count => {
      achievements.push({
        eventId: event.eventId,
        type: 'donor_milestone',
        title: `👥 ${count} Supporters`,
        description: `Amazing! ${count} people believe in this campaign.`,
        icon: '👥',
        priority: 3,
        metadata: { donorCount: count },
        generatedBy: 'auto',
      });
    });

    // Milestone achievements
    event.milestones.forEach((milestone, index) => {
      achievements.push({
        eventId: event.eventId,
        type: 'milestone_reached',
        title: `🎯 ${event.milestoneNames[index] || `Milestone ${index + 1}`}`,
        description: `Reached milestone: $${milestone}!`,
        icon: '🎯',
        priority: 4,
        metadata: { milestone: index + 1, amount: milestone },
        generatedBy: 'auto',
      });
    });

    return achievements;
  }

  /**
   * Check and unlock achievements based on current campaign state
   */
  async checkAndUnlockAchievements(event) {
    try {
      const achievements = await Achievement.find({ 
        eventId: event.eventId, 
        isUnlocked: false 
      });

      const unlockedAchievements = [];

      for (const achievement of achievements) {
        let shouldUnlock = false;

        switch (achievement.type) {
          case 'first_donation':
            shouldUnlock = event.totalAmount > 0;
            break;
            
          case 'funding_percentage':
            const percentage = (event.totalAmount / event.targetAmount) * 100;
            shouldUnlock = percentage >= (achievement.metadata.percentage || 0);
            break;
            
          case 'donor_milestone':
            shouldUnlock = event.uniqueDonors >= (achievement.metadata.donorCount || 0);
            break;
            
          case 'milestone_reached':
            const milestoneIndex = (achievement.metadata.milestone || 1) - 1;
            shouldUnlock = event.currentMilestone > milestoneIndex;
            break;
            
          case 'time_based':
            // Custom time-based logic can be added here
            break;
        }

        if (shouldUnlock) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          await achievement.save();
          unlockedAchievements.push(achievement);
          
          console.log(`🏆 Achievement unlocked: ${achievement.title} for ${event.name}`);
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error("Error checking achievements:", error);
      return [];
    }
  }

  /**
   * Get all achievements for a campaign
   */
  async getCampaignAchievements(eventId, includeUnlocked = true) {
    try {
      const filter = { eventId };
      if (!includeUnlocked) {
        filter.isUnlocked = false;
      }

      return await Achievement.find(filter)
        .sort({ priority: -1, unlockedAt: -1, createdAt: 1 });
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
  }
}

module.exports = new AchievementGeneratorService();
