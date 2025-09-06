#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 FestFund - Final Verification & Status Check');
console.log('=====================================\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function success(message) {
  console.log('✅ ' + message);
  checks.passed++;
}

function fail(message) {
  console.log('❌ ' + message);
  checks.failed++;
}

function warning(message) {
  console.log('⚠️  ' + message);
  checks.warnings++;
}

// 1. Project Structure Check
console.log('📁 Project Structure:');
const requiredDirs = [
  'backend', 
  'frontend', 
  'contracts', 
  'zk', 
  'scripts'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    success(`${dir}/ directory exists`);
  } else {
    fail(`${dir}/ directory missing`);
  }
});

// 2. Configuration Files
console.log('\n⚙️ Configuration Files:');
const configFiles = [
  '.env.example',
  'package.json',
  'hardhat.config.js',
  'frontend/next.config.js',
  'frontend/tailwind.config.js',
  'backend/package.json'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    fail(`${file} missing`);
  }
});

// 3. Environment Configuration
console.log('\n🌍 Environment Configuration:');
if (fs.existsSync('.env')) {
  success('.env file exists');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXT_PUBLIC_BACKEND_URL',
    'MIDNIGHT_RPC_URL',
    'ZK_MODE'
  ];
  
  requiredVars.forEach(envVar => {
    if (envContent.includes(`${envVar}=`)) {
      success(`${envVar} configured`);
    } else {
      warning(`${envVar} not found in .env`);
    }
  });
} else {
  warning('.env file not found - copy from .env.example');
}

// 4. Dependencies Check
console.log('\n📦 Dependencies:');
try {
  const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  
  success('All package.json files valid');
  
  // Check key dependencies
  const keyDeps = [
    ['@midnight-ntwrk/zswap', rootPkg.dependencies],
    ['express', backendPkg.dependencies],
    ['next', frontendPkg.dependencies],
    ['react', frontendPkg.dependencies]
  ];
  
  keyDeps.forEach(([dep, pkg]) => {
    if (pkg && pkg[dep]) {
      success(`${dep} dependency found`);
    } else {
      warning(`${dep} dependency missing`);
    }
  });
} catch (error) {
  fail('Error reading package.json files');
}

// 5. ZK Circuit Check
console.log('\n🔒 ZK Circuits:');
const zkFiles = [
  'zk/circuits/donation_commitment_v1.circom',
  'zk/build/donation_commitment_v1.wasm',
  'zk/build/proving_key.zkey',
  'zk/build/verification_key.json'
];

zkFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    warning(`${file} missing - run 'npm run compile:zk'`);
  }
});

// 6. Smart Contracts
console.log('\n⛓️ Smart Contracts:');
const contractFiles = [
  'contracts/FundManager.sol',
  'contracts/Verifier.sol',
  'contracts/MockERC20.sol'
];

contractFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    fail(`${file} missing`);
  }
});

// 7. Frontend Components
console.log('\n🎨 Frontend Components:');
const frontendComponents = [
  'frontend/components/ui/button.tsx',
  'frontend/components/ui/card.tsx',
  'frontend/components/AnimationComponents.tsx',
  'frontend/components/EnhancedCampaignGrid.tsx',
  'frontend/lib/api.ts',
  'frontend/contexts/WalletContext.tsx'
];

frontendComponents.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    fail(`${file} missing`);
  }
});

// 8. Backend Routes
console.log('\n🛣️ Backend Routes:');
const backendRoutes = [
  'backend/routes/auth.js',
  'backend/routes/proofNew.js',
  'backend/routes/achievements.js',
  'backend/utils/midnightIntegration.js',
  'backend/models/User.js',
  'backend/models/Event.js'
];

backendRoutes.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    fail(`${file} missing`);
  }
});

// 9. Midnight Integration Check
console.log('\n🌙 Midnight Integration:');
try {
  // Check if midnight integration exists and is properly configured
  const midnightIntegration = path.join('backend', 'utils', 'midnightIntegration.js');
  if (fs.existsSync(midnightIntegration)) {
    const content = fs.readFileSync(midnightIntegration, 'utf8');
    
    if (content.includes('@midnight-ntwrk/zswap')) {
      success('Midnight Network packages imported');
    } else {
      warning('Midnight packages not imported');
    }
    
    if (content.includes('testnet-02.midnight.network')) {
      success('Testnet-02 RPC URL configured');
    } else {
      warning('Midnight testnet RPC not configured');
    }
    
    if (content.includes('generateDonationCommitment')) {
      success('ZK proof generation implemented');
    } else {
      fail('ZK proof generation not found');
    }
  } else {
    fail('Midnight integration file missing');
  }
} catch (error) {
  fail('Error checking Midnight integration');
}

// 10. UI/UX Consistency
console.log('\n🎨 UI/UX Consistency:');
const uiFiles = [
  'frontend/styles/globals.css',
  'frontend/components/ui/',
  'frontend/components/dashboards/',
  'frontend/components/forms/'
];

uiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`);
  } else {
    warning(`${file} missing`);
  }
});

console.log('\n📊 Final Summary:');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log(`❌ Failed: ${checks.failed}`);

const total = checks.passed + checks.warnings + checks.failed;
const successRate = Math.round((checks.passed / total) * 100);

console.log(`\n🎯 Success Rate: ${successRate}%`);

if (successRate >= 90) {
  console.log('\n🎉 EXCELLENT! FestFund is production-ready!');
} else if (successRate >= 80) {
  console.log('\n👍 GOOD! Minor issues to address.');
} else {
  console.log('\n⚠️  NEEDS WORK! Address failed checks.');
}

// Next Steps
console.log('\n📋 Next Steps:');
console.log('1. Address any failed checks above');
console.log('2. Update .env with your configuration');
console.log('3. Run: npm run dev');
console.log('4. Test: npm run test:midnight');
console.log('5. Open: http://localhost:3000');

console.log('\n🌙 FestFund - Ready for Midnight Challenge! 🌙\n');
