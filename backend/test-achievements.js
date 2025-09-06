/**
 * Test script to demonstrate the achievement system
 * Run this after setting up the backend with: node test-achievements.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Import models and services
const Event = require("./models/Event");
const Achievement = require("./models/Achievement");
const Commitment = require("./models/CommitmentNew");
const achievementService = require("./services/achievementService");
const eventUpdateService = require("./services/eventUpdateService");

async function testAchievementSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/festfund"
    );
    console.log("✅ Connected to MongoDB");

    // Create a test campaign
    const testEvent = new Event({
      eventId: "test-campaign-" + Date.now(),
      name: "Save the Local Park",
      description: "Help us renovate our beloved community park with new playground equipment, walking trails, and green spaces for everyone to enjoy.",
      organizer: "0x742d35Cc6634C0532925a3b8D0FD67F4C0532925",
      milestones: [1000, 2500, 5000, 10000],
      milestoneNames: [
        "Planning Phase",
        "Equipment Purchase", 
        "Installation Begin",
        "Project Complete"
      ],
      targetAmount: 10000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currentMilestone: 0,
      status: "active",
      metadata: {
        category: "environment",
        tags: ["community", "environment", "family", "recreation"],
        imageUrl: "https://example.com/park.jpg",
        socialLinks: {
          website: "https://saveourpark.org",
          twitter: "saveourpark"
        }
      }
    });

    await testEvent.save();
    console.log(`✅ Created test campaign: ${testEvent.name}`);

    // Generate achievements for the campaign
    console.log("\n🎯 Generating achievements...");
    const achievements = await achievementService.generateCampaignAchievements(testEvent);
    
    console.log(`✅ Generated ${achievements.length} achievements:`);
    achievements.forEach((achievement, index) => {
      const status = achievement.isUnlocked ? "🔓 UNLOCKED" : "🔒 Pending";
      console.log(`   ${index + 1}. ${status} ${achievement.icon} ${achievement.title}`);
      console.log(`      ${achievement.description}`);
      console.log(`      Type: ${achievement.type}, Priority: ${achievement.priority}, By: ${achievement.generatedBy}`);
    });

    // Test achievement checking by simulating campaign progress
    console.log("\n💰 Simulating campaign progress to trigger achievements...");
    
    // Simulate first donation by manually updating event stats
    testEvent.totalAmount = 250;
    testEvent.uniqueDonors = 1;
    testEvent.totalCommitments = 1;
    await testEvent.save();
    
    let unlockedAchievements = await achievementService.checkAndUnlockAchievements(testEvent);
    console.log(`🎉 After first donation: Unlocked ${unlockedAchievements.length} achievements`);
    unlockedAchievements.forEach(a => console.log(`   🏆 ${a.title}`));

    // Simulate reaching 10% funding (1000 out of 10000)
    testEvent.totalAmount = 1000;
    testEvent.uniqueDonors = 5;
    testEvent.totalCommitments = 8;
    await testEvent.save();
    
    unlockedAchievements = await achievementService.checkAndUnlockAchievements(testEvent);
    console.log(`🎉 After 10% funding: Unlocked ${unlockedAchievements.length} achievements`);
    unlockedAchievements.forEach(a => console.log(`   🏆 ${a.title}`));

    // Simulate reaching first milestone (1000)
    testEvent.totalAmount = 1200;
    testEvent.uniqueDonors = 8;
    testEvent.currentMilestone = 1;
    await testEvent.save();
    
    unlockedAchievements = await achievementService.checkAndUnlockAchievements(testEvent);
    console.log(`🎉 After first milestone: Unlocked ${unlockedAchievements.length} achievements`);
    unlockedAchievements.forEach(a => console.log(`   🏆 ${a.title}`));

    // Simulate 25% funding
    testEvent.totalAmount = 2500;
    testEvent.uniqueDonors = 10;
    await testEvent.save();
    
    unlockedAchievements = await achievementService.checkAndUnlockAchievements(testEvent);
    console.log(`🎉 After 25% funding: Unlocked ${unlockedAchievements.length} achievements`);
    unlockedAchievements.forEach(a => console.log(`   🏆 ${a.title}`));

    // Show final achievement status
    console.log("\n📊 Final Achievement Status:");
    const allAchievements = await Achievement.find({ eventId: testEvent.eventId });
    const unlockedCount = allAchievements.filter(a => a.isUnlocked).length;
    const totalCount = allAchievements.length;
    const completionRate = ((unlockedCount / totalCount) * 100).toFixed(1);
    
    console.log(`   Total: ${totalCount} achievements`);
    console.log(`   Unlocked: ${unlockedCount} achievements`);
    console.log(`   Completion Rate: ${completionRate}%`);
    
    console.log("\n🎯 All Achievements:");
    allAchievements
      .sort((a, b) => b.priority - a.priority)
      .forEach((achievement, index) => {
        const status = achievement.isUnlocked ? "🔓" : "🔒";
        const unlockedText = achievement.isUnlocked 
          ? ` (unlocked ${new Date(achievement.unlockedAt).toLocaleDateString()})`
          : "";
        console.log(`   ${index + 1}. ${status} ${achievement.icon} ${achievement.title}${unlockedText}`);
        console.log(`      ${achievement.description}`);
      });

    // Test updating ranking after progress
    console.log("\n🔄 Testing event ranking update...");
    await testEvent.updateRanking();
    console.log(`� Campaign ranking score: ${testEvent.ranking.score}`);

    // Test manual achievement check without event update service
    console.log("\n🏆 Final achievement check...");
    const finalUnlocked = await achievementService.checkAndUnlockAchievements(testEvent);
    if (finalUnlocked.length > 0) {
      console.log(`🎉 Final check unlocked ${finalUnlocked.length} more achievements:`);
      finalUnlocked.forEach(a => console.log(`   🏆 ${a.title}`));
    } else {
      console.log("✅ No additional achievements to unlock");
    }

    console.log("\n🎉 Achievement system test completed successfully!");
    console.log("\nTo test the frontend:");
    console.log("1. Start the backend: cd backend && npm start");
    console.log("2. Start the frontend: cd frontend && npm run dev");
    console.log("3. Visit the campaign page to see achievements");
    console.log(`4. Campaign ID: ${testEvent.eventId}`);

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Disconnected from MongoDB");
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testAchievementSystem();
}

module.exports = { testAchievementSystem };
