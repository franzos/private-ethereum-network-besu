const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const chain = require('./besu_chain.js');

// Try to load private key from .env file in the root of the repo
let privateKey;
try {
  // Determine the root directory of the repo (parent of smart-contract-common)
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.join(rootDir, '.env');
  
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    privateKey = envConfig.DEFAULT_PRIVATE_KEY;
  }
} catch (error) {
  console.error(`Error reading .env file: ${error.message}`);
}

// Throw an error if private key is not set
if (!privateKey || privateKey.length < 10) {
  throw new Error('DEFAULT_PRIVATE_KEY is not set in .env file. Please run generate-env.sh to create the .env file.');
}

const account = privateKeyToAccount(privateKey);

const walletClient = createWalletClient({
  transport: http(chain.rpcUrls.default.http[0]),
  chain,
  account
});

module.exports = {
    walletClient,
    account,
    privateKey
};
