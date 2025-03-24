const fs = require('fs');
const path = require('path');
const deployContract = require('../smart-contract-common/deploy.js');
const { parseEther, encodeAbiParameters } = require('viem');
const constant = require('./constant.js');

const contractJsonPath = path.resolve(__dirname, `${constant.contractName}.json`);
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
const initialSupplyInWei = parseEther(constant.initialSupply.toString());

const encodedParams = encodeAbiParameters(
  [{ type: 'uint256' }],
  [initialSupplyInWei]
).slice(2); // Remove '0x' prefix

const data = `0x${contractJson.bytecode}${encodedParams}`;

deployContract(data).catch(console.error);
