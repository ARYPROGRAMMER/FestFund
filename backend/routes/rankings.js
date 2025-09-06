const express = require("express");
const router = express.Router();
const CommitmentNew = require("../models/CommitmentNew");

// Get user's rank in a specific event
router.get("/user-rank/:eventId/:userAddress", async (req, res) => {
  try {
    const { eventId, userAddress } = req.params;

    // Get all commitments for this event, sorted by amount (if revealed) or by timestamp
    const allCommitments = await CommitmentNew.find({
      eventId: eventId,
      $or: [
        { status: { $ne: "cancelled" } },
        { status: { $exists: false } }, // Handle old commitments without status field
      ],
    }).sort({
      revealedAmount: -1, // Sort by revealed amount first
      createdAt: 1, // Then by creation time (earlier = higher rank for same amounts)
    });

    // Find user's position in the ranking
    let userRank = null;
    const userCommitment = allCommitments.find(
      (commitment) =>
        commitment.donorAddress?.toLowerCase() === userAddress.toLowerCase()
    );

    if (userCommitment) {
      userRank = allCommitments.indexOf(userCommitment) + 1;
    }

    // Calculate ZK-proven rankings for this event
    const donorRankings = new Map();

    allCommitments.forEach((commitment) => {
      // Skip commitments without donor address
      if (!commitment.donorAddress) return;

      const donorAddress = commitment.donorAddress.toLowerCase();
      if (!donorRankings.has(donorAddress)) {
        donorRankings.set(donorAddress, {
          donorAddress: commitment.donorAddress,
          zkProvenTotal: 0,
          commitmentCount: 0,
          lastActive: commitment.timestamp || commitment.createdAt,
          privacyPreferences: {
            revealAmount: false,
            revealName: false,
            customDisplayName: null,
          },
          revealedAmount: 0,
        });
      }

      const donor = donorRankings.get(donorAddress);
      donor.commitmentCount += 1;
      donor.lastActive = commitment.timestamp || commitment.createdAt;

      // Add ZK-proven amount (this enables accurate ranking without revealing amounts)
      if (commitment.zkProvenAmount) {
        donor.zkProvenTotal += parseFloat(commitment.zkProvenAmount) || 0;
      } else if (commitment.revealedAmount) {
        // Fallback to revealed amount if ZK-proven amount not available (backward compatibility)
        donor.zkProvenTotal += parseFloat(commitment.revealedAmount) || 0;
      }

      // Track revealed amount separately (only for display if user chose to reveal)
      if (
        commitment.privacyPreferences?.revealAmount &&
        commitment.revealedAmount
      ) {
        donor.revealedAmount += parseFloat(commitment.revealedAmount) || 0;
      } else if (commitment.isRevealed && commitment.revealedAmount) {
        // Backward compatibility
        donor.revealedAmount += parseFloat(commitment.revealedAmount) || 0;
      }

      // Update privacy preferences
      if (commitment.privacyPreferences) {
        donor.privacyPreferences = {
          ...donor.privacyPreferences,
          ...commitment.privacyPreferences,
        };
      } else if (commitment.isRevealed) {
        // Backward compatibility - treat isRevealed as revealAmount
        donor.privacyPreferences.revealAmount = commitment.isRevealed;
      }
    });

    // Sort donors by ZK-proven amounts (accurate ranking while preserving privacy)
    const sortedDonors = Array.from(donorRankings.values())
      .filter((donor) => donor.donorAddress)
      .sort((a, b) => {
        // Primary sort: by ZK-proven total (highest first) - this gives accurate rankings
        if (b.zkProvenTotal !== a.zkProvenTotal) {
          return b.zkProvenTotal - a.zkProvenTotal;
        }
        // Secondary sort: by commitment count (more commits = higher rank)
        if (b.commitmentCount !== a.commitmentCount) {
          return b.commitmentCount - a.commitmentCount;
        }
        // Tertiary sort: by earliest contribution (earlier = higher rank)
        return new Date(a.lastActive) - new Date(b.lastActive);
      });

    // Find user's actual rank
    const userIndex = sortedDonors.findIndex(
      (donor) => donor.donorAddress?.toLowerCase() === userAddress.toLowerCase()
    );

    if (userIndex !== -1) {
      userRank = userIndex + 1;
    }

    res.json({
      success: true,
      rank: userRank,
      totalParticipants: sortedDonors.length,
      eventId: eventId,
    });
  } catch (error) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user ranking",
    });
  }
});

// Get general rankings for events/campaigns
router.get("/", async (req, res) => {
  try {
    const { type, timeframe, privacyMode, eventId, category } = req.query;

    let rankings = [];

    if (type === "campaign" && eventId) {
      // Get campaign-specific rankings
      const commitments = await CommitmentNew.find({
        eventId: eventId,
        $or: [
          { status: { $ne: "cancelled" } },
          { status: { $exists: false } }, // Handle old commitments without status field
        ],
      }).sort({
        revealedAmount: -1, // Sort by revealed amount first (descending)
        createdAt: 1, // Then by creation time (ascending - earlier = higher rank)
      });

      // Create ranking based on actual commitments
      const donorRankings = new Map();

      commitments.forEach((commitment) => {
        // Skip commitments without donor address
        if (!commitment.donorAddress) return;

        const donorAddress = commitment.donorAddress.toLowerCase();
        if (!donorRankings.has(donorAddress)) {
          donorRankings.set(donorAddress, {
            donorAddress: commitment.donorAddress,
            zkProvenTotal: 0,
            commitmentCount: 0,
            lastActive:
              commitment.createdAt || commitment.timestamp || new Date(),
            privacyPreferences: {
              revealAmount: false,
              revealName: false,
              customDisplayName: null,
            },
            revealedAmount: 0,
          });
        }

        const donor = donorRankings.get(donorAddress);
        donor.commitmentCount += 1;

        // Add ZK-proven amount for accurate ranking
        if (commitment.zkProvenAmount) {
          donor.zkProvenTotal += parseFloat(commitment.zkProvenAmount) || 0;
        } else if (commitment.revealedAmount) {
          // Fallback for backward compatibility
          donor.zkProvenTotal += parseFloat(commitment.revealedAmount) || 0;
        }

        // Handle revealed amounts for display (based on privacy preferences)
        if (
          commitment.privacyPreferences?.revealAmount &&
          commitment.revealedAmount
        ) {
          donor.revealedAmount += parseFloat(commitment.revealedAmount) || 0;
        } else if (commitment.isRevealed && commitment.revealedAmount) {
          // Backward compatibility
          donor.revealedAmount += parseFloat(commitment.revealedAmount) || 0;
        }

        // Update privacy preferences
        if (commitment.privacyPreferences) {
          donor.privacyPreferences = {
            ...donor.privacyPreferences,
            ...commitment.privacyPreferences,
          };
        } else if (commitment.isRevealed) {
          donor.privacyPreferences.revealAmount = commitment.isRevealed;
        }

        // Update last active to most recent commitment
        const commitmentDate = new Date(
          commitment.createdAt || commitment.timestamp || new Date()
        );
        if (commitmentDate > new Date(donor.lastActive)) {
          donor.lastActive = commitmentDate;
        }
      });

      // Sort by ZK-proven amounts for accurate rankings with privacy preservation
      const sortedDonors = Array.from(donorRankings.values())
        .filter((donor) => donor.donorAddress) // Filter out any invalid entries
        .sort((a, b) => {
          // Primary sort: by ZK-proven total (highest first)
          if (b.zkProvenTotal !== a.zkProvenTotal) {
            return b.zkProvenTotal - a.zkProvenTotal;
          }
          // Secondary sort: by commitment count (more commits = higher rank)
          if (b.commitmentCount !== a.commitmentCount) {
            return b.commitmentCount - a.commitmentCount;
          }
          // Tertiary sort: by earliest contribution (earlier = higher rank)
          return new Date(a.lastActive) - new Date(b.lastActive);
        });

      // Format rankings with privacy preferences
      rankings = sortedDonors.map((donor, index) => ({
        id: donor.donorAddress,
        rank: index + 1,
        displayName: donor.privacyPreferences?.revealName
          ? donor.privacyPreferences.customDisplayName ||
            `${donor.donorAddress.slice(0, 6)}...${donor.donorAddress.slice(
              -4
            )}`
          : `Anonymous #${index + 1}`,
        donorAddress: donor.privacyPreferences?.revealName
          ? donor.donorAddress
          : null,
        // Show amount only if user chose to reveal it
        totalDonated: donor.privacyPreferences?.revealAmount
          ? donor.revealedAmount
          : null,
        isAmountRevealed: donor.privacyPreferences?.revealAmount || false,
        isNameRevealed: donor.privacyPreferences?.revealName || false,
        campaignsSupported: 1,
        zkProofsGenerated: donor.commitmentCount,
        privacyScore:
          100 -
          (donor.privacyPreferences?.revealAmount ? 25 : 0) -
          (donor.privacyPreferences?.revealName ? 25 : 0),
        isAnonymous: !(donor.privacyPreferences?.revealName || false),
        achievements: [],
        momentum: "stable",
        lastActive: donor.lastActive,
        commitmentCount: donor.commitmentCount,
      }));
    } else {
      // For global rankings, we could aggregate across all events
      // For now, return empty array since we want campaign-specific rankings
      rankings = [];
    }

    res.json({
      success: true,
      rankings: rankings,
      totalParticipants: rankings.length,
      eventId: eventId,
    });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rankings",
    });
  }
});

module.exports = router;
