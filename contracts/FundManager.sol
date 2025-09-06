// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Verifier.sol";

/**
 * @title FundManager
 * @dev Manages fundraising events with ZK proof verification for milestone achievements
 */
contract FundManager {
    struct Event {
        string name;
        string description;
        address organizer;
        uint256[] milestones;
        uint256 totalCommitted;
        uint256 currentMilestone;
        bool isActive;
        uint256 createdAt;
    }

    struct Commitment {
        bytes32 commitmentHash;
        address donor;
        uint256 eventId;
        uint256 timestamp;
        bool isRevealed;
    }

    // State variables
    mapping(uint256 => Event) public events;
    mapping(uint256 => Commitment[]) public eventCommitments;
    mapping(bytes32 => bool) public usedCommitments;
    
    uint256 public nextEventId;
    Verifier public immutable verifier;

    // Events
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event CommitmentMade(uint256 indexed eventId, bytes32 commitmentHash, address donor);
    event MilestoneProven(uint256 indexed eventId, uint256 milestone, uint256 topKSum);
    event EventCompleted(uint256 indexed eventId);

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
        nextEventId = 1;
    }

    /**
     * @dev Create a new fundraising event
     * @param _name Event name
     * @param _description Event description
     * @param _milestones Array of milestone amounts
     */
    function createEvent(
        string memory _name,
        string memory _description,
        uint256[] memory _milestones
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Event name required");
        require(_milestones.length > 0, "At least one milestone required");
        
        // Ensure milestones are in ascending order
        for (uint256 i = 1; i < _milestones.length; i++) {
            require(_milestones[i] > _milestones[i-1], "Milestones must be ascending");
        }

        uint256 eventId = nextEventId++;
        
        events[eventId] = Event({
            name: _name,
            description: _description,
            organizer: msg.sender,
            milestones: _milestones,
            totalCommitted: 0,
            currentMilestone: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        emit EventCreated(eventId, _name, msg.sender);
        return eventId;
    }

    /**
     * @dev Submit a commitment to an event
     * @param _eventId Event ID
     * @param _commitmentHash Hash of the commitment (amount + nonce)
     */
    function submitCommitment(uint256 _eventId, bytes32 _commitmentHash) external {
        require(_eventId < nextEventId, "Event does not exist");
        require(events[_eventId].isActive, "Event not active");
        require(!usedCommitments[_commitmentHash], "Commitment already used");

        usedCommitments[_commitmentHash] = true;
        
        eventCommitments[_eventId].push(Commitment({
            commitmentHash: _commitmentHash,
            donor: msg.sender,
            eventId: _eventId,
            timestamp: block.timestamp,
            isRevealed: false
        }));

        emit CommitmentMade(_eventId, _commitmentHash, msg.sender);
    }

    /**
     * @dev Verify ZK proof for milestone achievement
     * @param _eventId Event ID
     * @param _milestoneIndex Index of the milestone to prove
     * @param _proof ZK proof data
     * @param _publicInputs Public inputs for verification
     */
    function verifyMilestone(
        uint256 _eventId,
        uint256 _milestoneIndex,
        uint256[8] calldata _proof,
        uint256[] calldata _publicInputs
    ) external {
        require(_eventId < nextEventId, "Event does not exist");
        require(events[_eventId].isActive, "Event not active");
        require(msg.sender == events[_eventId].organizer, "Only organizer can verify");
        require(_milestoneIndex < events[_eventId].milestones.length, "Invalid milestone");
        require(_milestoneIndex == events[_eventId].currentMilestone, "Must verify milestones in order");

        // Verify the ZK proof
        bool isValid = verifier.verifyProof(
            _proof,
            _publicInputs
        );
        
        require(isValid, "Invalid proof");

        // Extract milestone amount and top-K sum from public inputs
        uint256 milestoneAmount = events[_eventId].milestones[_milestoneIndex];
        uint256 topKSum = _publicInputs[_publicInputs.length - 1]; // Last public input is the sum

        require(topKSum >= milestoneAmount, "Milestone not reached");

        events[_eventId].currentMilestone++;
        
        emit MilestoneProven(_eventId, milestoneAmount, topKSum);

        // Check if all milestones are completed
        if (events[_eventId].currentMilestone >= events[_eventId].milestones.length) {
            events[_eventId].isActive = false;
            emit EventCompleted(_eventId);
        }
    }

    /**
     * @dev Get event details
     */
    function getEvent(uint256 _eventId) external view returns (Event memory) {
        require(_eventId < nextEventId, "Event does not exist");
        return events[_eventId];
    }

    /**
     * @dev Get commitments for an event
     */
    function getEventCommitments(uint256 _eventId) external view returns (Commitment[] memory) {
        require(_eventId < nextEventId, "Event does not exist");
        return eventCommitments[_eventId];
    }

    /**
     * @dev Get number of commitments for an event
     */
    function getCommitmentCount(uint256 _eventId) external view returns (uint256) {
        require(_eventId < nextEventId, "Event does not exist");
        return eventCommitments[_eventId].length;
    }

    /**
     * @dev Emergency pause for organizer
     */
    function pauseEvent(uint256 _eventId) external {
        require(_eventId < nextEventId, "Event does not exist");
        require(msg.sender == events[_eventId].organizer, "Only organizer can pause");
        events[_eventId].isActive = false;
    }
}
