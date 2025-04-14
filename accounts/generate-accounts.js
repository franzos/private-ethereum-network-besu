const fs = require("fs");
const path = require("path");

const accountsDir = path.join(__dirname);

const { generatePrivateKey, privateKeyToAccount } = require("viem/accounts");

function loadAccountSpecs() {
  const specFilePath = path.join(__dirname, "spec.json");
  const exampleSpecFilePath = path.join(__dirname, "spec.json.example");

  let specData;

  try {
    if (fs.existsSync(specFilePath)) {
      console.log("Reading account specifications from spec.json");
      specData = JSON.parse(fs.readFileSync(specFilePath, "utf8"));
    } else {
      // Fall back to spec.json.example
      console.log("spec.json not found, reading from spec.json.example");
      specData = JSON.parse(fs.readFileSync(exampleSpecFilePath, "utf8"));
    }
    return specData.accounts;
  } catch (error) {
    console.error("Error loading account specifications:", error.message);
    process.exit(1);
  }
}

function generateAccount() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    privateKey: privateKey.slice(2), // Remove '0x' prefix
  };
}

const accountSpecs = loadAccountSpecs();
console.log(`Generating ${accountSpecs.length} Ethereum accounts...`);

const accounts = [];
for (let i = 0; i < accountSpecs.length; i++) {
  const account = generateAccount();
  accounts.push(account);

  const accountNumber = i + 1;

  const fileName = `account_${accountNumber}_${accountSpecs[i].name
    .toLowerCase()
    .replace("_", "-")}`;

  fs.writeFileSync(
    path.join(accountsDir, fileName),
    account.privateKey,
    "utf8"
  );

  fs.writeFileSync(
    path.join(accountsDir, `${fileName}.pub`),
    account.address,
    "utf8"
  );

  console.log(`Account ${accountNumber} generated:`);
  console.log(`  Name: ${accountSpecs[i].name}`);
  console.log(`  Address: ${account.address}`);
  console.log(`  Private key saved to: accounts/${fileName}`);
  console.log(`  Public address saved to: accounts/${fileName}.pub`);
}

console.log("\nUpdating qbftConfigFile.json...");
const configFilePath = path.join(__dirname, "..", "qbftConfigFile.json");
const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));

config.genesis.alloc = {};

accounts.forEach((account, index) => {
  config.genesis.alloc[account.address.slice(2).toLowerCase()] = {
    comment: accountSpecs[index].name,
    balance: accountSpecs[index].balance,
  };
});

fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf8");

console.log("qbftConfigFile.json updated with new accounts");
console.log("\nAccount generation complete!");
