const fs = require('fs');
const path = require('path');
const queryTransactionStatus = require('../smart-contract-common/query_transaction.js');

const transactionHash = fs.readFileSync(path.join(__dirname, 'transaction_hash'), 'utf8').trim();
queryTransactionStatus(transactionHash).catch(console.error);
