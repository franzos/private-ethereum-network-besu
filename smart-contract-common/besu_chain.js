const { defineChain } = require("viem");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const defaults = {
  networkId: 1337,
  currencyName: "Ether",
  currencySymbol: "ETH",
  currencyDecimals: 18,
  rpcUrl: "http://127.0.0.1:8546",
};

let envValues = { ...defaults };
try {
  const rootDir = path.resolve(__dirname, "..");
  const envPath = path.join(rootDir, ".env");

  if (fs.existsSync(envPath)) {
    console.debug(`Reading .env file from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    envValues = {
      networkId: parseInt(envConfig.NETWORK_ID || defaults.networkId),
      currencyName: envConfig.CURRENCY_NAME || defaults.currencyName,
      currencySymbol: envConfig.CURRENCY_SYMBOL || defaults.currencySymbol,
      currencyDecimals: parseInt(
        envConfig.CURRENCY_DECIMALS || defaults.currencyDecimals
      ),
      rpcUrl: envConfig.RPC_URL || defaults.rpcUrl,
    };
  } else {
    console.warn(
      "Warning: .env file not found in the repository root. Using default values."
    );
  }
} catch (error) {
  console.warn(
    `Warning: Error reading .env file: ${error.message}. Using default values.`
  );
}

const besuChain = defineChain({
  id: envValues.networkId,
  name: "besu",
  nativeCurrency: {
    name: envValues.currencyName,
    symbol: envValues.currencySymbol,
    decimals: envValues.currencyDecimals,
  },
  rpcUrls: {
    default: {
      http: [envValues.rpcUrl],
    },
  },
});

module.exports = besuChain;
