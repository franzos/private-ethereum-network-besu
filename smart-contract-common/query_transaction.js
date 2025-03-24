const publicClient = require('./public_client.js');

async function queryTransactionStatus(transactionHash) {
  try {
    console.log(`Querying transaction status for hash: ${transactionHash}`);
    
    const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash });
    
    if (receipt.status === 'success') {
      console.log('Transaction was successful.');
    } else if (receipt.status === 'failure') {
      console.log('Transaction failed.');
    } else {
      console.log('Transaction status unknown.');
    }
    
    console.log('Transaction details:', JSON.stringify(receipt, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    return receipt;
  } catch (error) {
    console.error('Error querying transaction status:', error);
    throw error;
  }
}

module.exports = queryTransactionStatus;