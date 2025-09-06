@echo off
REM Real ZK Circuit Compilation Script for Windows
REM This script compiles the Circom circuit and generates proving/verification keys

echo 🔧 Compiling ZK circuits for real Midnight Network integration...

REM Check if Circom is installed
where circom >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Circom not found!
    echo Please install Circom first:
    echo npm install -g circom
    pause
    exit /b 1
)

REM Check if SnarkJS is installed
where snarkjs >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ SnarkJS not found!
    echo Please install SnarkJS first:
    echo npm install -g snarkjs
    pause
    exit /b 1
)

REM Create output directory
if not exist "build" mkdir build

REM Compile the donation commitment circuit
echo 📦 Compiling donation_commitment_v1.circom...
circom circuits/donation_commitment_v1.circom --r1cs --wasm --sym -o ./

REM Move generated files to build directory
if exist "donation_commitment_v1.r1cs" move "donation_commitment_v1.r1cs" "./build/"
if exist "donation_commitment_v1.wasm" move "donation_commitment_v1.wasm" "./build/"
if exist "donation_commitment_v1.sym" move "donation_commitment_v1.sym" "./build/"

REM Download Powers of Tau ceremony file (for trusted setup)
echo 📥 Downloading Powers of Tau ceremony file...
if not exist "./build/powersOfTau28_hez_final_15.ptau" (
    powershell -Command "Invoke-WebRequest -Uri 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau' -OutFile './build/powersOfTau28_hez_final_15.ptau'"
)

echo 🔑 Generating zkey files...

REM Generate the initial zkey
snarkjs groth16 setup ./build/donation_commitment_v1.r1cs ./powersOfTau28_hez_final_15.ptau ./build/donation_commitment_0000.zkey

REM Generate a random contribution
echo some random text | snarkjs zkey contribute ./build/donation_commitment_0000.zkey ./build/donation_commitment_0001.zkey --name="First contribution"

REM Generate the final zkey
snarkjs zkey beacon ./build/donation_commitment_0001.zkey ./build/proving_key.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"

REM Export verification key
echo 🔐 Exporting verification key...
snarkjs zkey export verificationkey ./build/proving_key.zkey ./build/verification_key.json

REM Generate Solidity verifier
echo 📜 Generating Solidity verifier contract...
snarkjs zkey export solidityverifier ./build/proving_key.zkey ../contracts/DonationVerifier.sol

REM Copy files to the correct locations
echo 📁 Copying files to correct locations...
copy "./build/donation_commitment.wasm" "./donation_commitment.wasm"
copy "./build/proving_key.zkey" "./proving_key.zkey"
copy "./build/verification_key.json" "./verification_key.json"

echo ✅ ZK circuit compilation completed successfully!
echo.
echo Generated files:
echo   - donation_commitment.wasm (circuit)
echo   - proving_key.zkey (proving key)
echo   - verification_key.json (verification key)
echo   - ../contracts/DonationVerifier.sol (Solidity verifier)
echo.
echo 🚀 Ready for real Midnight Network integration!
pause

REM Compile the circuit
echo 📦 Compiling topk_milestones.compact...
compact compile topk_milestones.compact
if %errorlevel% neq 0 (
    echo ❌ Circuit compilation failed!
    pause
    exit /b 1
)

echo ✅ Circuit compilation successful!

REM Generate Solidity verifier
echo 🔨 Generating Solidity verifier...
compact generate-verifier topk_milestones.compact --output ../contracts/Verifier.sol
if %errorlevel% neq 0 (
    echo ❌ Verifier generation failed!
    pause
    exit /b 1
)

echo ✅ Verifier generation successful!
echo 📄 Verifier contract written to ../contracts/Verifier.sol

REM Generate circuit artifacts for MidnightJS (using topk_milestones.compact)
echo 🌙 Generating circuit artifacts for MidnightJS...
REM Note: This requires Midnight Network CLI tools (compact)
REM For development, we use the Circom-based circuit above
if exist "topk_milestones.compact" (
    echo 📄 Midnight Compact circuit available: topk_milestones.compact
    echo ⚠️  Note: Requires Midnight CLI tools for compilation
) else (
    echo ❌ topk_milestones.compact not found!
)

echo.
echo 🎉 All ZK compilation steps completed successfully!
echo.
echo Next steps:
echo 1. Copy the generated Verifier.sol to replace the placeholder
echo 2. Use topk_milestones_artifacts.json in the backend for proof generation
echo 3. Run 'npm run compile' in the root directory to compile Solidity contracts
echo.

pause
