const fs = require('fs');
const path = require('path');
const { parseAbi } = require('viem');
const publicClient = require('../smart-contract-common/public_client.js');
const private = require('../smart-contract-common/private_client.js');

// Check if recipient address and amount are provided
if (process.argv.length < 4) {
  console.error('Usage: node transfer_tokens.js <recipient_address> <amount>');
  console.error('Example: node transfer_tokens.js 0x123... 100');
  process.exit(1);
}

const recipientAddress = process.argv[2];
const amount = process.argv[3];

let contractAddress;
try {
  contractAddress = fs.readFileSync(path.join(__dirname, 'contract_address'), 'utf8').trim();
  console.log('Contract address loaded from file:', contractAddress);
} catch (error) {
  console.error('Error reading contract address from file:', error);
  console.error('Please make sure the contract_address file exists in the smart-contract-erc20 directory');
  process.exit(1);
}

const contractAbi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]);

async function getDecimals() {
  try {
    return await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'decimals'
    });
  } catch (error) {
    console.error('Error getting decimals:', error);
    throw error;
  }
}

async function transferTokens(to, amount) {
  try {
    // Get token decimals
    const decimals = await getDecimals();
    
    // Convert amount to token units with decimals
    const tokenAmount = BigInt(amount) * BigInt(10 ** decimals);
    
    console.log(`Transferring ${amount} tokens (${tokenAmount} base units) to ${to}...`);
    
    const hash = await private.walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'transfer',
      args: [to, tokenAmount]
    });
    
    console.log('Transaction hash:', hash);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    return hash;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
}

async function main() {
  try {
    await transferTokens(recipientAddress, amount);
    
    // Get updated balances
    const decimals = await getDecimals();
    
    const senderBalance = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'balanceOf',
      args: [private.account.address]
    });
    
    const recipientBalance = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'balanceOf',
      args: [recipientAddress]
    });
    
    // Format balances with decimals
    const formattedSenderBalance = Number(senderBalance) / (10 ** Number(decimals));
    const formattedRecipientBalance = Number(recipientBalance) / (10 ** Number(decimals));
    
    console.log('\nUpdated Balances:');
    console.log(`Sender (${private.account.address}): ${formattedSenderBalance} tokens`);
    console.log(`Recipient (${recipientAddress}): ${formattedRecipientBalance} tokens`);
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
