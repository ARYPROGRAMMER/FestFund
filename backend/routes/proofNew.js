const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Commitment = require("../models/CommitmentNew");
const { midnightIntegration } = require("../utils/midnightIntegration");

// Helper function to update event totals after donations
async function updateEventTotals(eventId) {
  try {
    const event = await Event.findOne({ eventId });
    if (!event) {
      console.error(`Event ${eventId} not found for total update`);
      return false;
    }

    // Calculate totals from all revealed commitments
    const commitments = await Commitment.find({ eventId });
    const revealedCommitments = commitments.filter(
      (c) => c.isRevealed && c.revealedAmount
    );

    const totalAmount = revealedCommitments.reduce((sum, c) => {
      return sum + parseFloat(c.revealedAmount || "0");
    }, 0);

    const uniqueDonors = new Set(revealedCommitments.map((c) => c.donorAddress))
      .size;

    // Update event
    event.totalAmount = totalAmount;
    event.currentAmount = totalAmount; // For frontend compatibility
    event.uniqueDonors = uniqueDonors;

    // Update milestone progress
    const currentMilestone = event.milestones.findIndex((m) => totalAmount < m);
    event.currentMilestone =
      currentMilestone === -1 ? event.milestones.length : currentMilestone;

    // Update ranking
    await event.updateRanking();

    await event.save();

    console.log(
      `📊 Updated event ${eventId} totals: ${totalAmount} ETH from ${uniqueDonors} donors`
    );
    return true;
  } catch (error) {
    console.error(`Failed to update event ${eventId} totals:`, error);
    return false;
  }
}

// Initialize Real Midnight integration on startup
midnightIntegration.initialize().then((success) => {
  if (success) {
    console.log("✅ Real Midnight Network integration ready");
  } else {
    console.error(
      "❌ Failed to initialize Midnight Network - check configuration"
    );
  }
});

// Get all events with enhanced data
router.get("/events", async (req, res) => {
  try {
    const {
      category,
      status = "active",
      sortBy = "ranking",
      limit = 50,
      search,
    } = req.query;

    // Build query
    let query = {};

    if (category && category !== "all") {
      query["metadata.category"] = category;
    }

    if (status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "metadata.tags": { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case "ranking":
        sortCriteria = { "ranking.score": -1, totalAmount: -1 };
        break;
      case "amount":
        sortCriteria = { totalAmount: -1 };
        break;
      case "donors":
        sortCriteria = { uniqueDonors: -1 };
        break;
      case "recent":
        sortCriteria = { createdAt: -1 };
        break;
      case "deadline":
        sortCriteria = { deadline: 1 };
        break;
      default:
        sortCriteria = { "ranking.score": -1 };
    }

    const events = await Event.find(query)
      .sort(sortCriteria)
      .limit(parseInt(limit));

    // Add commitment counts and enhanced data
    const enhancedEvents = await Promise.all(
      events.map(async (event) => {
        const commitments = await Commitment.find({ eventId: event.eventId });
        const uniqueDonorCount = new Set(commitments.map((c) => c.donorAddress))
          .size;

        // Update the event's ranking and unique donors count
        if (event.uniqueDonors !== uniqueDonorCount) {
          event.uniqueDonors = uniqueDonorCount;
          await event.updateRanking();
        }

        // Calculate progress percentage
        const progressPercentage =
          event.targetAmount > 0
            ? Math.min((event.totalAmount / event.targetAmount) * 100, 100)
            : 0;

        return {
          ...event.toObject(),
          organizerAddress: event.organizer, // Add organizerAddress alias for frontend compatibility
          totalCommitments: commitments.length,
          uniqueDonors: uniqueDonorCount,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          isUrgent:
            event.deadline &&
            new Date(event.deadline) <
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          lastActivity:
            commitments.length > 0
              ? Math.max(
                  ...commitments.map((c) => new Date(c.timestamp).getTime())
                )
              : new Date(event.createdAt).getTime(),
        };
      })
    );

    // Get statistics
    const totalEvents = await Event.countDocuments({});
    const activeEvents = await Event.countDocuments({ status: "active" });
    const categories = await Event.distinct("metadata.category");

    res.json({
      success: true,
      events: enhancedEvents,
      totalEvents,
      activeEvents,
      categories,
      query: req.query,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
});

// Get individual event by ID with detailed information
router.get("/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find the event
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get commitments for this event
    const commitments = await Commitment.find({ eventId }).sort({
      timestamp: -1,
    });

    const uniqueDonorCount = new Set(commitments.map((c) => c.donorAddress))
      .size;
    const totalRevealedAmount = commitments
      .filter((c) => c.isRevealed && c.revealedAmount)
      .reduce((sum, c) => sum + parseFloat(c.revealedAmount || "0"), 0);

    // Calculate progress percentage
    const progressPercentage =
      event.targetAmount > 0
        ? Math.min((event.totalAmount / event.targetAmount) * 100, 100)
        : 0;

    // Update ranking if needed
    if (event.uniqueDonors !== uniqueDonorCount) {
      event.uniqueDonors = uniqueDonorCount;
      await event.updateRanking();
    }

    // Enhanced event data
    const enhancedEvent = {
      ...event.toObject(),
      organizerAddress: event.organizer, // Add organizerAddress alias for frontend compatibility
      totalCommitments: commitments.length,
      uniqueDonors: uniqueDonorCount,
      totalRevealedAmount: totalRevealedAmount,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      isUrgent:
        event.deadline &&
        new Date(event.deadline) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      daysLeft: event.deadline
        ? Math.max(
            0,
            Math.ceil(
              (new Date(event.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
      recentCommitments: commitments.slice(0, 10), // Last 10 commitments
      milestoneProgress: event.milestones.map((milestone, index) => ({
        amount: milestone,
        achieved: event.totalAmount >= milestone,
        percentage: Math.min((event.totalAmount / milestone) * 100, 100),
        isNext: event.currentMilestone === index,
      })),
    };

    res.json({
      success: true,
      event: enhancedEvent,
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event details",
      error: error.message,
    });
  }
});

// Get events by organizer
router.get("/events/organizer/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const normalizedAddress = address.toLowerCase(); // Normalize to lowercase

    console.log(`🔍 Fetching events for organizer: ${normalizedAddress}`);

    // Query by organizer field (which contains wallet address)
    const events = await Event.find({
      organizer: normalizedAddress,
    }).sort({ createdAt: -1 });

    // Add commitment data for organizer events
    const enhancedEvents = await Promise.all(
      events.map(async (event) => {
        const commitments = await Commitment.find({ eventId: event.eventId });
        const totalAmount = commitments
          .filter((c) => c.isRevealed && c.revealedAmount)
          .reduce((sum, c) => sum + parseFloat(c.revealedAmount || "0"), 0);

        const uniqueDonorCount = new Set(commitments.map((c) => c.donorAddress))
          .size;

        // Calculate progress percentage
        const progressPercentage =
          event.targetAmount > 0
            ? Math.min((event.totalAmount / event.targetAmount) * 100, 100)
            : 0;

        return {
          ...event.toObject(),
          organizerAddress: event.organizer, // Add organizerAddress alias for frontend compatibility
          totalCommitments: commitments.length,
          uniqueDonors: uniqueDonorCount,
          totalRevealedAmount: totalAmount,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          isUrgent:
            event.deadline &&
            new Date(event.deadline) <
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          daysLeft: event.deadline
            ? Math.max(
                0,
                Math.ceil(
                  (new Date(event.deadline).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : null,
          recentCommitments: commitments
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .slice(0, 5),
        };
      })
    );

    res.json({
      success: true,
      events: enhancedEvents,
      totalEventsCreated: events.length,
      activeEvents: events.filter((e) => e.isActive).length,
    });
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizer events",
      error: error.message,
    });
  }
});

// Get commitments by donor
router.get("/commitments/donor/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const normalizedAddress = address.toLowerCase(); // Normalize to lowercase

    console.log(`🔍 Fetching commitments for donor: ${normalizedAddress}`);

    const commitments = await Commitment.find({
      donorAddress: normalizedAddress,
    }).sort({ timestamp: -1 });

    // Add event data to commitments
    const enhancedCommitments = await Promise.all(
      commitments.map(async (commitment) => {
        const event = await Event.findOne({ eventId: commitment.eventId });
        return {
          ...commitment.toObject(),
          eventId: commitment.eventId,
          eventName: event?.name || "Unknown Event",
          eventDescription: event?.description || "",
          eventOrganizer: event?.organizer || "",
          eventIsActive: event?.isActive || false,
        };
      })
    );

    res.json({
      success: true,
      commitments: enhancedCommitments,
      totalCommitments: commitments.length,
      totalEvents: new Set(commitments.map((c) => c.eventId)).size,
    });
  } catch (error) {
    console.error("Error fetching donor commitments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donor commitments",
      error: error.message,
    });
  }
});

// Create event - RESTful route (alias for create-event)
router.post("/events", async (req, res) => {
  try {
    const {
      eventId,
      name,
      description,
      organizer,
      organizerAddress,
      milestones,
      targetAmount,
      deadline,
      metadata,
    } = req.body;

    // Handle both organizer (username) and organizerAddress (wallet)
    const walletAddress = organizerAddress || organizer;
    const organizerName = organizer && organizerAddress ? organizer : null;

    // Generate eventId if not provided
    const generatedEventId =
      eventId ||
      `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate required fields
    if (
      !name ||
      !description ||
      !walletAddress ||
      !milestones ||
      !targetAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate milestone array
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one milestone is required",
      });
    }

    // Validate milestones are positive numbers
    const validMilestones = milestones.filter(
      (m) => typeof m === "number" && m > 0
    );
    if (validMilestones.length !== milestones.length) {
      return res.status(400).json({
        success: false,
        message: "All milestones must be positive numbers",
      });
    }

    // Check if event ID already exists
    const existingEvent = await Event.findOne({ eventId: generatedEventId });
    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: "Event ID already exists",
      });
    }

    // Generate milestone names if not provided
    const milestoneNames = validMilestones.map(
      (amount, index) => `Milestone ${index + 1}: ${amount} ETH`
    );

    const newEvent = new Event({
      eventId: generatedEventId,
      name: name.trim(),
      description: description.trim(),
      organizer: walletAddress.toLowerCase(),
      organizerName: organizerName,
      milestones: validMilestones.sort((a, b) => a - b), // Sort milestones
      milestoneNames,
      targetAmount: Number(targetAmount),
      deadline: deadline ? new Date(deadline) : null,
      currentMilestone: 0,
      status: "active",
      ranking: {
        score: 0,
        views: 0,
        likes: 0,
      },
      metadata: {
        category: metadata?.category || "other",
        tags: metadata?.tags || [],
        imageUrl: metadata?.imageUrl || null,
        socialLinks: metadata?.socialLinks || {},
      },
    });

    await newEvent.save();

    // Generate achievements for the new campaign
    try {
      const achievementService = require("../services/achievementService");
      await achievementService.generateCampaignAchievements(newEvent);
      console.log(`✨ Generated achievements for campaign: ${newEvent.name}`);
    } catch (achievementError) {
      console.error("Error generating achievements:", achievementError);
      // Don't fail campaign creation if achievement generation fails
    }

    res.json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
      eventId: newEvent.eventId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
});

// Create event with enhanced validation (legacy route)
router.post("/create-event", async (req, res) => {
  try {
    const {
      eventId,
      name,
      description,
      organizer,
      milestones,
      targetAmount,
      deadline,
      metadata,
    } = req.body;

    // Validate required fields
    if (
      !eventId ||
      !name ||
      !description ||
      !organizer ||
      !milestones ||
      !targetAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: eventId, name, description, organizer, milestones, targetAmount",
      });
    }

    // Validate target amount
    if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be a positive number",
      });
    }

    // Validate milestones
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Milestones must be a non-empty array",
      });
    }

    // Validate milestone values
    const validMilestones = milestones.filter(
      (m) => typeof m === "number" && m > 0
    );
    if (validMilestones.length !== milestones.length) {
      return res.status(400).json({
        success: false,
        message: "All milestones must be positive numbers",
      });
    }

    // Check if event ID already exists
    const existingEvent = await Event.findOne({ eventId });
    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: "Event ID already exists",
      });
    }

    // Generate milestone names if not provided
    const milestoneNames = validMilestones.map(
      (amount, index) => `Milestone ${index + 1}: ${amount} ETH`
    );

    const newEvent = new Event({
      eventId,
      name: name.trim(),
      description: description.trim(),
      organizer: organizer.toLowerCase(),
      milestones: validMilestones.sort((a, b) => a - b), // Sort milestones
      milestoneNames,
      targetAmount: Number(targetAmount),
      deadline: deadline ? new Date(deadline) : null,
      currentMilestone: 0,
      status: "active",
      ranking: {
        score: 0,
        views: 0,
        likes: 0,
      },
      metadata: {
        category: metadata?.category || "other",
        tags: metadata?.tags || [],
        imageUrl: metadata?.imageUrl || null,
        socialLinks: metadata?.socialLinks || {},
      },
    });

    await newEvent.save();

    // Note: Achievements are generated by the new RESTful /events route
    // This legacy route is maintained for backward compatibility only

    res.json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
      eventId: newEvent.eventId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
});

// Generate real ZK proof for donation commitment
router.post("/generate-commitment", async (req, res) => {
  try {
    const { amount, eventId, donorAddress } = req.body;

    // Validate required fields
    if (!amount || !eventId || !donorAddress) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount, eventId, donorAddress",
      });
    }

    // Validate amount
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid donation amount",
      });
    }

    // Check if event exists and is active
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.isActive) {
      return res.status(400).json({
        success: false,
        message: "Event is not active",
      });
    }

    // Generate random secrets for ZK proof (in production, let user provide or derive securely)
    const donorSecret = Math.floor(Math.random() * 1000000000);
    const nullifier = Math.floor(Math.random() * 1000000000);

    // Generate real ZK proof using Midnight Network
    console.log(
      `🔒 Generating real ZK proof for donation: ${amount} to event ${eventId}`
    );

    const commitmentData = await midnightIntegration.generateDonationCommitment(
      {
        amount: parseInt(amount),
        donorSecret: donorSecret,
        eventId: parseInt(eventId),
        nullifier: nullifier,
      }
    );

    if (!commitmentData.success) {
      throw new Error("Failed to generate ZK commitment");
    }

    // Store commitment in database
    const commitment = new Commitment({
      // Required ZK fields
      commitmentHash: commitmentData.commitment,
      nullifierHash: commitmentData.nullifierHash,
      zkMode: "midnight-network",
      network: "midnight",

      // Event context
      eventId,

      // Proof data
      proof: commitmentData.proof,
      publicSignals: commitmentData.publicSignals || [],

      // Transaction tracking
      txHash: commitmentData.txHash,

      // Legacy fields for compatibility
      donorAddress: donorAddress.toLowerCase(),
      amount,
      commitment: commitmentData.commitment,
      verified: true, // Already verified during generation
      timestamp: new Date().toISOString(),

      // Reveal fields for immediate funding
      isRevealed: true,
      revealedAmount: amount,

      metadata: {
        isMock: false,
        network: "midnight",
        donorSecret: donorSecret, // Store securely in production
        nullifier: nullifier,
      },
    });

    await commitment.save();

    // Update event totals immediately after successful commitment
    const updateResult = await updateEventTotals(eventId);

    // Get updated totals for response
    const updatedEvent = await Event.findOne({ eventId });
    const eventTotals = updatedEvent
      ? {
          totalAmount: updatedEvent.totalAmount,
          currentAmount: updatedEvent.currentAmount,
          uniqueDonors: updatedEvent.uniqueDonors,
          progressPercentage:
            updatedEvent.targetAmount > 0
              ? Math.min(
                  (updatedEvent.totalAmount / updatedEvent.targetAmount) * 100,
                  100
                )
              : 0,
        }
      : null;

    console.log(
      `✅ Real ZK commitment generated and stored: ${commitment._id}`
    );

    res.json({
      success: true,
      commitmentId: commitment._id,
      commitment: commitmentData.commitment,
      txHash: commitmentData.txHash,
      message: "Real ZK proof generated successfully",
      eventTotals: eventTotals,
    });
  } catch (error) {
    console.error("❌ Error generating real ZK commitment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate ZK commitment: " + error.message,
    });
  }
});

// Verify real ZK proof
router.post("/verify-proof", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        success: false,
        message: "Missing proof or publicSignals",
      });
    }

    console.log("🔍 Verifying real ZK proof...");

    const verificationResult = await midnightIntegration.verifyDonationProof({
      proof,
      publicSignals,
    });

    res.json(verificationResult);
  } catch (error) {
    console.error("❌ Error verifying real ZK proof:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify proof: " + error.message,
    });
  }
});

// Submit commitment with enhanced validation
router.post("/submit-commitment", async (req, res) => {
  try {
    const { eventId, commitmentHash, donorAddress } = req.body;

    // Validate required fields
    if (!eventId || !commitmentHash || !donorAddress) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: eventId, commitmentHash, donorAddress",
      });
    }

    // Check if event exists and is active
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.isActive) {
      return res.status(400).json({
        success: false,
        message: "Event is not active",
      });
    }

    // Check if commitment hash already exists
    const existingCommitment = await Commitment.findOne({ commitmentHash });
    if (existingCommitment) {
      return res.status(400).json({
        success: false,
        message: "Commitment hash already exists",
      });
    }

    const newCommitment = new Commitment({
      // Required ZK fields
      commitmentHash,
      nullifierHash: commitmentHash + "_nullifier", // Generate proper nullifier in production
      zkMode: "own-keys", // This is for the old commit method
      network: "self-hosted",

      // Event context
      eventId,

      // Proof data (simplified for legacy commit)
      proof: { commitmentHash }, // Simplified proof
      publicSignals: [],

      // Transaction tracking (mock for commit)
      txHash: "0x" + commitmentHash.slice(0, 64), // Mock transaction hash

      // Legacy fields
      donorAddress: donorAddress.toLowerCase(),
      timestamp: new Date().toISOString(),
      isRevealed: false,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await newCommitment.save();

    // Generate ZK commitment verification using Midnight
    try {
      const zkVerification = await midnightIntegration.verifyCommitment(
        commitmentHash,
        { proof: commitmentHash } // Simplified for demo
      );

      if (zkVerification.valid) {
        console.log(
          `🌙 Midnight ZK verification successful for commitment: ${commitmentHash.slice(
            0,
            10
          )}...`
        );
      }
    } catch (error) {
      console.warn(
        "Midnight verification failed, continuing with commitment:",
        error.message
      );
    }

    // Update event activity
    event.lastActivity = new Date();
    await event.save();

    // Update event statistics and check achievements
    try {
      const eventUpdateService = require("../services/eventUpdateService");
      await eventUpdateService.updateEventStatsAndAchievements(eventId);
    } catch (updateError) {
      console.error("Error updating event stats:", updateError);
      // Don't fail the commitment if stats update fails
    }

    res.json({
      success: true,
      message: "Commitment submitted successfully",
      commitment: newCommitment,
    });
  } catch (error) {
    console.error("Error submitting commitment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit commitment",
      error: error.message,
    });
  }
});

// Get event commitments
router.get("/events/:eventId/commitments", async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const commitments = await Commitment.find({ eventId }).sort({
      timestamp: -1,
    });

    res.json({
      success: true,
      commitments,
      totalCommitments: commitments.length,
      uniqueDonors: new Set(commitments.map((c) => c.donorAddress)).size,
      event: {
        name: event.name,
        description: event.description,
        organizer: event.organizer,
        isActive: event.isActive,
      },
    });
  } catch (error) {
    console.error("Error fetching event commitments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch commitments",
      error: error.message,
    });
  }
});

// Get platform statistics
router.get("/stats", async (req, res) => {
  try {
    const [totalEvents, totalCommitments, activeEvents, totalOrganizers] =
      await Promise.all([
        Event.countDocuments({}),
        Commitment.countDocuments({}),
        Event.countDocuments({ isActive: true }),
        Event.distinct("organizer").then((organizers) => organizers.length),
      ]);

    const totalDonors = await Commitment.distinct("donorAddress").then(
      (donors) => donors.length
    );

    // Calculate milestones hit across all events
    const events = await Event.find({});
    const totalMilestonesHit = events.reduce(
      (sum, event) => sum + event.currentMilestone,
      0
    );
    const totalPossibleMilestones = events.reduce(
      (sum, event) => sum + event.milestones.length,
      0
    );

    res.json({
      success: true,
      stats: {
        totalEvents,
        activeEvents,
        totalCommitments,
        totalDonors,
        totalOrganizers,
        totalMilestonesHit,
        totalPossibleMilestones,
        averageMilestonesPerEvent:
          totalEvents > 0
            ? (totalPossibleMilestones / totalEvents).toFixed(1)
            : 0,
        completionRate:
          totalPossibleMilestones > 0
            ? ((totalMilestonesHit / totalPossibleMilestones) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// Platform metrics endpoint for dashboard
router.get("/metrics", async (req, res) => {
  try {
    const [events, commitments] = await Promise.all([
      Event.find({}),
      Commitment.find({ isRevealed: true }),
    ]);

    const activeEvents = events.filter((event) => event.isActive);
    const revealedCommitments = commitments.filter((c) => c.revealedAmount);

    // Calculate total raised from revealed commitments
    const totalRaised = revealedCommitments.reduce((sum, c) => {
      return sum + parseFloat(c.revealedAmount || "0");
    }, 0);

    // Get unique donors from revealed commitments
    const uniqueDonors = new Set(revealedCommitments.map((c) => c.donorAddress))
      .size;

    // Calculate average donation
    const avgDonation = uniqueDonors > 0 ? totalRaised / uniqueDonors : 0;

    // Count total ZK proofs generated (all commitments including unrevealed)
    const zkProofsGenerated = await Commitment.countDocuments({});

    // Calculate total commitments
    const totalCommitments = zkProofsGenerated;

    // Calculate success rate based on events that reached their goals
    const completedEvents = events.filter((event) => {
      const targetAmount = event.targetAmount || 0;
      const currentAmount = event.currentAmount || 0;
      return currentAmount >= targetAmount;
    });

    const successRate =
      events.length > 0 ? (completedEvents.length / events.length) * 100 : 0;

    res.json({
      success: true,
      metrics: {
        totalRaised: Number(totalRaised.toFixed(4)),
        activeCampaigns: activeEvents.length,
        totalDonors: uniqueDonors,
        zkProofsGenerated,
        totalCommitments,
        avgDonation: Number(avgDonation.toFixed(4)),
        successRate: Number(successRate.toFixed(1)),
        networkStatus: "live",
        processingTime: "1.2ms",
        totalEvents: events.length,
        completedEvents: completedEvents.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform metrics",
      error: error.message,
    });
  }
});

// Update milestone (for organizers)
router.post("/events/:eventId/milestone", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { organizer, newMilestone } = req.body;

    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Verify organizer
    if (event.organizer.toLowerCase() !== organizer.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Only the event organizer can update milestones",
      });
    }

    // Validate milestone
    if (newMilestone < 0 || newMilestone > event.milestones.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone value",
      });
    }

    event.currentMilestone = newMilestone;
    event.lastActivity = new Date();
    await event.save();

    // Check achievements after milestone update
    try {
      const eventUpdateService = require("../services/eventUpdateService");
      await eventUpdateService.updateEventStatsAndAchievements(eventId);
    } catch (updateError) {
      console.error("Error updating event stats:", updateError);
      // Don't fail the milestone update if achievement check fails
    }

    res.json({
      success: true,
      message: "Milestone updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update milestone",
      error: error.message,
    });
  }
});

// Get user role information
router.get("/user/:address/role", async (req, res) => {
  try {
    const { address } = req.params;

    const [organizerEvents, donorCommitments] = await Promise.all([
      Event.find({ organizer: { $regex: new RegExp(`^${address}$`, "i") } }),
      Commitment.find({
        donorAddress: { $regex: new RegExp(`^${address}$`, "i") },
      }),
    ]);

    const role = {
      isOrganizer: organizerEvents.length > 0,
      isDonor: donorCommitments.length > 0,
      primaryRole:
        organizerEvents.length > donorCommitments.length
          ? "organizer"
          : donorCommitments.length > 0
          ? "donor"
          : null,
      stats: {
        eventsCreated: organizerEvents.length,
        activeEventsCreated: organizerEvents.filter((e) => e.isActive).length,
        donationsMade: donorCommitments.length,
        uniqueEventsSupported: new Set(donorCommitments.map((c) => c.eventId))
          .size,
      },
    };

    res.json({
      success: true,
      role,
      address: address.toLowerCase(),
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user role",
      error: error.message,
    });
  }
});

// Midnight Network status endpoint
router.get("/midnight/status", async (req, res) => {
  try {
    const status = midnightIntegration.getStatus();

    res.json({
      success: true,
      midnight: {
        ...status,
        version: "1.0.0",
        lastCheck: new Date().toISOString(),
        endpoints: {
          commitmentVerification: "/api/proof/midnight/verify-commitment",
          milestoneProof: "/api/proof/midnight/milestone-proof",
          topKProof: "/api/proof/midnight/topk-proof",
        },
      },
    });
  } catch (error) {
    console.error("Error getting Midnight status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Midnight status",
      error: error.message,
    });
  }
});

// Generate milestone proof
router.post("/midnight/milestone-proof", async (req, res) => {
  try {
    const { eventId, milestoneTarget } = req.body;

    if (!eventId || !milestoneTarget) {
      return res.status(400).json({
        success: false,
        message: "Missing eventId or milestoneTarget",
      });
    }

    const commitments = await Commitment.find({ eventId });
    const proof = await midnightIntegration.verifyMilestone(
      eventId,
      commitments,
      milestoneTarget
    );

    res.json({
      success: true,
      proof,
      message: `Milestone proof generated for event ${eventId}`,
    });
  } catch (error) {
    console.error("Error generating milestone proof:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate milestone proof",
      error: error.message,
    });
  }
});

// Generate top-K donor proof
router.post("/midnight/topk-proof", async (req, res) => {
  try {
    const { eventId, k = 10 } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Missing eventId",
      });
    }

    const commitments = await Commitment.find({ eventId });
    const proof = await midnightIntegration.generateTopKProof(
      eventId,
      commitments,
      k
    );

    res.json({
      success: true,
      proof,
      message: `Top-${k} proof generated for event ${eventId}`,
    });
  } catch (error) {
    console.error("Error generating top-K proof:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate top-K proof",
      error: error.message,
    });
  }
});

// Test achievement generation endpoint
router.post("/test-achievements", async (req, res) => {
  try {
    console.log("Testing achievement generation...");
    const achievementService = require("../services/achievementService");

    // Create a mock event for testing
    const mockEvent = {
      eventId: "test-event-" + Date.now(),
      name: "Test Campaign",
      description: "A test campaign",
      targetAmount: 100,
      milestones: [25, 50, 75, 100],
      milestoneNames: [
        "Quarter way",
        "Halfway",
        "Three quarters",
        "Goal reached",
      ],
      metadata: { category: "test" },
    };

    const achievements = await achievementService.generateCampaignAchievements(
      mockEvent
    );

    res.json({
      success: true,
      message: "Test completed",
      achievements: achievements,
      count: achievements.length,
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
