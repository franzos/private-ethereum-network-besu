const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const besuChain = require('./besu_chain.js');

const host = 'http://localhost:8546';
const privateKey = '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f';
const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  transport: http(host)
});

const walletClient = createWalletClient({
  transport: http(host),
  chain: besuChain,
  account
});

const contractBinPath = path.resolve(__dirname, "StorageExample_sol_StorageExample.bin");
const contractBin = fs.readFileSync(contractBinPath, 'utf8');

const contractConstructorInit = "000000000000000000000000000000000000000000000000000000000000002F";

function writeContractAddressToFile(contractAddress) {
  try {
    fs.writeFileSync('contract_address', contractAddress);
    console.log(`Contract address written to file: contract_address`);
  } catch (error) {
    console.error('Error writing contract address to file:', error);
  }
}

async function deployContract() {
  try {
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });

    const data = `0x${contractBin}${contractConstructorInit}`;

    console.log("Creating transaction...");
    const transactionRequest = {
      account,
      to: null,
      data,
      nonce,
      gasPrice: 0n,
      gas: BigInt(4000000),
      value: 0n
    };

    console.log("Signing transaction...");
    const signedTransaction = await walletClient.signTransaction(transactionRequest);

    console.log("Sending transaction...");
    const hash = await walletClient.sendRawTransaction({
      serializedTransaction: signedTransaction
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("tx transactionHash: " + receipt.transactionHash);
    console.log("tx contractAddress: " + receipt.contractAddress);
    
    if (receipt.contractAddress) {
      writeContractAddressToFile(receipt.contractAddress);
    }

    return receipt;
  } catch (error) {
    console.error("Error deploying contract:", error);
    throw error;
  }
}

deployContract().catch(console.error);
