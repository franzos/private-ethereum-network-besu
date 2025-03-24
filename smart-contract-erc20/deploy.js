const fs = require('fs');
const path = require('path');
const publicClient = require('../smart-contract-common/public_client.js');
const private = require('../smart-contract-common/private_client.js');
const { parseEther, encodeAbiParameters } = require('viem');

const contractJsonPath = path.resolve(__dirname, "TestToken.json");
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));

const initialSupply = 7000000000n;
const initialSupplyInWei = parseEther(initialSupply.toString());

async function deployContract() {
  try {
    const nonce = await publicClient.getTransactionCount({
      address: private.account.address
    });

    // Encode constructor parameters and append to bytecode
    const encodedParams = encodeAbiParameters(
      [{ type: 'uint256' }],
      [initialSupplyInWei]
    ).slice(2); // Remove '0x' prefix
    
    const data = `0x${contractJson.bytecode}${encodedParams}`;
    
    console.log("Deploying with initial supply:", initialSupply.toString(), "tokens");
    console.log("Initial supply in wei:", initialSupplyInWei.toString());

    console.log("Estimating gas...");
  
    const gas = 4000000n;
    // const gas = await publicClient.estimateGas({
    //   account: private.account,
    //   to: null,
    //   data,
    //   value: 0n,
    // });

    console.log("Fetching gas price...");
    const maxFeePerGas = await publicClient.getGasPrice();

    console.log("Creating transaction...");
    const transactionRequest = {
      account: private.account,
      to: null,
      data,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas: 1n,
      gas,
      value: 0n,
      type: 'eip1559'
    };

    console.log("Signing transaction...");
    const signedTransaction = await private.walletClient.signTransaction(transactionRequest);

    console.log("Sending transaction...");
    const hash = await private.walletClient.sendRawTransaction({
      serializedTransaction: signedTransaction
    });

    console.log("Transaction sent, waiting for receipt...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("tx transactionHash: " + receipt.transactionHash);
    console.log("tx contractAddress: " + receipt.contractAddress);

    fs.writeFileSync('transaction_hash', receipt.transactionHash);
    fs.writeFileSync('contract_address', receipt.contractAddress);

    return receipt;
  } catch (error) {
    console.error("Error deploying contract:", error);
    throw error;
  }
}

deployContract().catch(console.error);
