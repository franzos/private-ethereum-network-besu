const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const chain = require('../smart-contract-common/besu_chain.js');
const private = require('../smart-contract-common/private_client.js');
const constant = require('./constant.js');

const web3 = new Web3.Web3(chain.rpcUrls.default.http[0]);
const account = web3.eth.accounts.privateKeyToAccount(private.privateKey);
web3.eth.accounts.wallet.add(account);

async function deployContract() {
  try {
    const contractJsonPath = path.resolve(__dirname, `${constant.contractName}.json`);
    const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
    const contractBin = contractJson.bytecode.replace('0x', '');
    const contractConstructorInit = "000000000000000000000000000000000000000000000000000000000000002F";

    const txnCount = await web3.eth.getTransactionCount(account.address);
    const data = `0x${contractBin}${contractConstructorInit}`;

    const gas = await web3.eth.estimateGas({
      from: account.address,
      data
    });

    const gasPrice = await web3.eth.getGasPrice(); // Fetch non-zero gas price dynamically

    const transaction = {
      from: account.address,
      data,
      gas,
      gasPrice, // Use fetched gas price
      nonce: txnCount
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(transaction, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

    fs.writeFileSync('transaction_hash', receipt.transactionHash);
    fs.writeFileSync('contract_address', receipt.contractAddress);

    console.log(`Contract deployed at: ${receipt.contractAddress}`);
    return receipt;
  } catch (error) {
    console.error("Error deploying contract:", error);
    throw error;
  }
}

deployContract().catch(console.error);
