#!/bin/bash

# Real ZK Circuit Compilation Script for Midnight Network
# This script compiles the Circom circuit and generates proving/verification keys

set -e

echo "🔧 Compiling ZK circuits for real Midnight Network integration..."

# Check if required tools are installed
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found!"
    echo "Please install Circom first:"
    echo "npm install -g circom"
    exit 1
fi

if ! command -v snarkjs &> /dev/null; then
    echo "❌ SnarkJS not found!"
    echo "Please install SnarkJS first:"
    echo "npm install -g snarkjs"
    exit 1
fi

# Create output directory
mkdir -p ./build

# Compile the donation commitment circuit
echo "📦 Compiling donation_commitment.circom..."
circom circuits/donation_commitment.circom --r1cs --wasm --sym -o ./build

# Download Powers of Tau ceremony file (for trusted setup)
echo "📥 Downloading Powers of Tau ceremony file..."
if [ ! -f "./build/powersOfTau28_hez_final_15.ptau" ]; then
    wget -O ./build/powersOfTau28_hez_final_15.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau
fi

echo "🔑 Generating zkey files..."

# Generate the initial zkey
snarkjs groth16 setup ./build/donation_commitment.r1cs ./build/powersOfTau28_hez_final_15.ptau ./build/donation_commitment_0000.zkey

# Generate a random contribution (in production, use a proper ceremony)
echo "some random text" | snarkjs zkey contribute ./build/donation_commitment_0000.zkey ./build/donation_commitment_0001.zkey --name="First contribution" -v

# Generate the final zkey
snarkjs zkey beacon ./build/donation_commitment_0001.zkey ./build/proving_key.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"

# Export verification key
echo "🔐 Exporting verification key..."
snarkjs zkey export verificationkey ./build/proving_key.zkey ./build/verification_key.json

# Generate Solidity verifier
echo "📜 Generating Solidity verifier contract..."
snarkjs zkey export solidityverifier ./build/proving_key.zkey ../contracts/DonationVerifier.sol

# Copy files to the correct locations
echo "� Copying files to correct locations..."
cp ./build/donation_commitment.wasm ./donation_commitment.wasm
cp ./build/proving_key.zkey ./proving_key.zkey
cp ./build/verification_key.json ./verification_key.json

echo "✅ ZK circuit compilation completed successfully!"
echo ""
echo "Generated files:"
echo "  - donation_commitment.wasm (circuit)"
echo "  - proving_key.zkey (proving key)"
echo "  - verification_key.json (verification key)" 
echo "  - ../contracts/DonationVerifier.sol (Solidity verifier)"
echo ""
echo "🚀 Ready for real Midnight Network integration!"
compact compile topk_milestones.compact

if [ $? -eq 0 ]; then
    echo "✅ Circuit compilation successful!"
else
    echo "❌ Circuit compilation failed!"
    exit 1
fi

# Generate Solidity verifier
echo "🔨 Generating Solidity verifier..."
compact generate-verifier topk_milestones.compact --output ../contracts/Verifier.sol

if [ $? -eq 0 ]; then
    echo "✅ Verifier generation successful!"
    echo "📄 Verifier contract written to ../contracts/Verifier.sol"
else
    echo "❌ Verifier generation failed!"
    exit 1
fi

# Generate circuit artifacts for MidnightJS
echo "🌙 Generating circuit artifacts for MidnightJS..."
compact export topk_milestones.compact --output topk_milestones_artifacts.json

if [ $? -eq 0 ]; then
    echo "✅ Circuit artifacts generated!"
    echo "📄 Artifacts written to topk_milestones_artifacts.json"
else
    echo "❌ Artifact generation failed!"
    exit 1
fi

echo ""
echo "🎉 All ZK compilation steps completed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy the generated Verifier.sol to replace the placeholder"
echo "2. Use topk_milestones_artifacts.json in the backend for proof generation"
echo "3. Run 'npm run compile' in the root directory to compile Solidity contracts"
echo ""
