const express = require("express");
const router = express.Router();
const CommitmentNew = require("../models/CommitmentNew");

// Update privacy preferences for a user's commitments
router.post("/update-privacy", async (req, res) => {
  try {
    const { userAddress, eventId, privacyPreferences } = req.body;

    // Validate required fields
    if (!userAddress || !eventId || !privacyPreferences) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: userAddress, eventId, privacyPreferences",
      });
    }

    // Validate privacy preferences structure
    const { revealAmount, revealName, customDisplayName } = privacyPreferences;
    if (typeof revealAmount !== "boolean" || typeof revealName !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid privacy preferences format",
      });
    }

    // Find all commitments for this user and event
    const commitments = await CommitmentNew.find({
      donorAddress: { $regex: new RegExp(`^${userAddress}$`, "i") },
      eventId: eventId,
    });

    if (commitments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No commitments found for this user and event",
      });
    }

    // Update privacy preferences for all user's commitments in this event
    const updateResult = await CommitmentNew.updateMany(
      {
        donorAddress: { $regex: new RegExp(`^${userAddress}$`, "i") },
        eventId: eventId,
      },
      {
        $set: {
          privacyPreferences: {
            revealAmount: revealAmount,
            revealName: revealName,
            customDisplayName: customDisplayName || null,
          },
          // Update legacy fields for backward compatibility
          isRevealed: revealAmount,
        },
      }
    );

    console.log(
      `🔒 Updated privacy preferences for ${userAddress} in event ${eventId}:`,
      {
        revealAmount,
        revealName,
        customDisplayName,
        affectedCommitments: updateResult.modifiedCount,
      }
    );

    res.json({
      success: true,
      message: "Privacy preferences updated successfully",
      affectedCommitments: updateResult.modifiedCount,
      preferences: privacyPreferences,
    });
  } catch (error) {
    console.error("Error updating privacy preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update privacy preferences",
      error: error.message,
    });
  }
});

// Get current privacy preferences for a user in an event
router.get("/privacy/:userAddress/:eventId", async (req, res) => {
  try {
    const { userAddress, eventId } = req.params;

    // Find the most recent commitment for this user and event
    const commitment = await CommitmentNew.findOne({
      donorAddress: { $regex: new RegExp(`^${userAddress}$`, "i") },
      eventId: eventId,
    }).sort({ createdAt: -1 }); // Get most recent

    if (!commitment) {
      return res.status(404).json({
        success: false,
        message: "No commitments found for this user and event",
      });
    }

    // Return current privacy preferences
    const preferences = commitment.privacyPreferences || {
      revealAmount: commitment.isRevealed || false,
      revealName: false,
      customDisplayName: null,
    };

    res.json({
      success: true,
      preferences: preferences,
      commitmentCount: await CommitmentNew.countDocuments({
        donorAddress: { $regex: new RegExp(`^${userAddress}$`, "i") },
        eventId: eventId,
      }),
    });
  } catch (error) {
    console.error("Error fetching privacy preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch privacy preferences",
      error: error.message,
    });
  }
});

module.exports = router;
