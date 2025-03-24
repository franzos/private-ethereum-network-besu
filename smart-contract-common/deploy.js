const fs = require('fs');
const publicClient = require('./public_client.js');
const private = require('./private_client.js');

async function deployContract(data, gasOverwrite) {
  try {
    const nonce = await publicClient.getTransactionCount({
      address: private.account.address,
    });

    console.log("Estimating gas...");
    //   const gas = 4000000n;
    const gas = gasOverwrite
      ? gasOverwrite
      : await publicClient.estimateGas({
          account: private.account,
          to: null,
          data,
          value: 0n,
        });

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
      type: "eip1559",
    };

    console.log("Signing transaction...");
    const signedTransaction = await private.walletClient.signTransaction(
      transactionRequest
    );

    console.log("Sending transaction...");
    const hash = await private.walletClient.sendRawTransaction({
      serializedTransaction: signedTransaction,
    });

    console.log("Transaction sent, waiting for receipt...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("tx transactionHash: " + receipt.transactionHash);
    console.log("tx contractAddress: " + receipt.contractAddress);

    fs.writeFileSync("transaction_hash", receipt.transactionHash);
    fs.writeFileSync("contract_address", receipt.contractAddress);

    return receipt;
  } catch (error) {
    console.error("Error deploying contract:", error);
    throw error;
  }
}

module.exports = deployContract;
