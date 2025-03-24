const fs = require('fs');
const path = require('path');
const deployContract = require('../smart-contract-common/deploy.js');
const constant = require('./constant.js');

const contractJsonPath = path.resolve(__dirname, `${constant.contractName}.json`);
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));

const data = `0x${contractJson.bytecode}`;

deployContract(data).catch(console.error);
