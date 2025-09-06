const { ethers } = require("ethers");

/**
 * Verify wallet signature for authentication
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature from the wallet
 * @param {string} expectedAddress - The wallet address that should have signed the message
 * @returns {boolean} - True if signature is valid
 */
function verifySignature(message, signature, expectedAddress) {
  try {
    // Check if this is a mock signature (for testing)
    if (isMockSignature(signature, expectedAddress)) {
      console.log("Mock signature detected - allowing for testing");
      return true;
    }

    // Real signature verification
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Check if a signature is a mock signature for testing
 * @param {string} signature - The signature to check
 * @param {string} expectedAddress - The expected wallet address
 * @returns {boolean} - True if this is a mock signature
 */
function isMockSignature(signature, expectedAddress) {
  // Check if we're in mock mode based on environment variable
  const useMockMode = process.env.USE_MOCK_MODE === "true";
  
  if (!useMockMode) {
    return false; // Not in mock mode, don't allow mock signatures
  }
  
  // Mock wallet address used in testing
  const MOCK_WALLET_ADDRESS = "0x3bb14190f2E9143fdc6E9bc3BB7510B1DaEa5b11";
  
  // Check if this is the mock wallet and signature has mock pattern
  if (expectedAddress.toLowerCase() === MOCK_WALLET_ADDRESS.toLowerCase()) {
    // Mock signatures: 0x followed by 130 zeros and 2 hex characters (total 132 chars)
    const mockPattern = /^0x0{130}[0-9a-fA-F]{2}$/;
    const isValidMockSignature = mockPattern.test(signature);
    console.log("Mock signature validation:", {
      signature,
      expectedAddress,
      pattern: mockPattern.toString(),
      isValid: isValidMockSignature
    });
    return isValidMockSignature;
  }
  
  return false;
}

/**
 * Generate a message for wallet authentication
 * @param {string} walletAddress - The wallet address
 * @param {number} timestamp - The timestamp when the message was created
 * @returns {string} - The message to be signed
 */
function generateAuthMessage(walletAddress, timestamp) {
  return `FestFund Authentication\nTimestamp: ${timestamp}\nWallet: ${walletAddress}`;
}

/**
 * Validate that a signature message is recent (within 5 minutes)
 * @param {string} message - The message that contains timestamp
 * @returns {boolean} - True if message is recent
 */
function validateMessageTimestamp(message) {
  try {
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) return false;

    const messageTimestamp = parseInt(timestampMatch[1]);
    const currentTimestamp = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return currentTimestamp - messageTimestamp < fiveMinutes;
  } catch (error) {
    console.error("Timestamp validation error:", error);
    return false;
  }
}

module.exports = {
  verifySignature,
  generateAuthMessage,
  validateMessageTimestamp,
};
