const fs = require('fs');
const path = require('path');
const { parseAbi } = require('viem');
const publicClient = require('../smart-contract-common/public_client.js');
const private = require('../smart-contract-common/private_client.js');

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

async function getTokenInfo() {
  try {
    const name = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'name'
    });
    
    const symbol = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'symbol'
    });
    
    const decimals = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'decimals'
    });
    
    const totalSupply = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'totalSupply'
    });
    
    console.log('Token Information:');
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Decimals:', decimals);
    console.log('Total Supply:', totalSupply.toString());
    
    // Format total supply with decimals
    const formattedSupply = Number(totalSupply) / Math.pow(10, Number(decimals));
    console.log('Formatted Total Supply:', formattedSupply);
    
    return { name, symbol, decimals, totalSupply };
  } catch (error) {
    console.error('Error getting token info:', error);
    throw error;
  }
}

async function getBalance(address) {
  try {
    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'balanceOf',
      args: [address]
    });
    
    console.log(`Balance of ${address}:`, balance.toString());
    
    // Get decimals to format the balance
    const decimals = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'decimals'
    });
    
    // Format balance with decimals
    const formattedBalance = Number(balance) / Math.pow(10, Number(decimals));
    console.log(`Formatted Balance of ${address}:`, formattedBalance);
    
    return balance;
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

async function transferTokens(to, amount) {
  try {
    console.log(`Transferring ${amount} tokens to ${to}...`);
    
    const hash = await private.walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'transfer',
      args: [to, BigInt(amount)]
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
    console.log('\n--- Token Information ---');
    await getTokenInfo();
    
    console.log('\n--- Owner Balance ---');
    await getBalance(private.account.address);
    
    // Example: Transfer tokens to another address
    // Uncomment and modify the following lines to test token transfer
    /*
    console.log('\n--- Transferring Tokens ---');
    const recipientAddress = '0x...'; // Replace with recipient address
    const transferAmount = '1000000000000000000'; // 1 token with 18 decimals
    await transferTokens(recipientAddress, transferAmount);
    
    console.log('\n--- Updated Balances ---');
    await getBalance(private.account.address);
    await getBalance(recipientAddress);
    */
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
