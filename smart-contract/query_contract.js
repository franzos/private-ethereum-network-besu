const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
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

let contractAddress;
try {
  contractAddress = fs.readFileSync(path.join(__dirname, 'contract_address'), 'utf8').trim();
  console.log('Contract address loaded from file:', contractAddress);
} catch (error) {
  console.error('Error reading contract address from file:', error);
  console.error('Please make sure the contract_address file exists in the smart-contract directory');
  process.exit(1);
}

const contractAbi = parseAbi([
  'function get() view returns (uint256)',
  'function set(uint256 x)',
  'function storedData() view returns (uint256)',
  'event stored(address indexed _to, uint256 _amount)'
]);

async function readStoredValue() {
  try {
    const value = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'get'
    });
    console.log('Current stored value:', value.toString());
    return value;
  } catch (error) {
    console.error('Error reading stored value:', error);
    throw error;
  }
}

async function readStoredDataVariable() {
  try {
    const value = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'storedData'
    });
    console.log('storedData variable value:', value.toString());
    return value;
  } catch (error) {
    console.error('Error reading storedData variable:', error);
    throw error;
  }
}

async function updateStoredValue(newValue) {
  try {
    console.log(`Updating stored value to: ${newValue}`);
    
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'set',
      args: [BigInt(newValue)]
    });
    
    console.log('Transaction hash:', hash);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    return hash;
  } catch (error) {
    console.error('Error updating stored value:', error);
    throw error;
  }
}

function listenForStoredEvents() {
  console.log('Listening for stored events...');
  
  const unwatch = publicClient.watchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: 'stored',
    onLogs: (logs) => {
      for (const log of logs) {
        console.log('New stored event:');
        console.log('  Block:', log.blockNumber);
        
        if (log.args) {
          console.log('  Address:', log.args._to || 'Not available');
          console.log('  Value:', log.args._amount ? log.args._amount.toString() : 'Not available');
        } else {
          console.log('  Args: Not available');
        }
        
        console.log('  Raw event data:', JSON.stringify(log, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value, 2));
      }
    }
  });
  
  console.log('Event listener set up. Press Ctrl+C to stop.');
  return unwatch;
}

async function getPastEvents() {
  try {
    console.log('Fetching past stored events...');
    
    const currentBlock = await publicClient.getBlockNumber();
    console.log(`Current block number: ${currentBlock}`);
    
    // Besu has a limit of 5000 events per request
    const CHUNK_SIZE = 4000n;
    let fromBlock = 0n;
    let allLogs = [];
    
    while (fromBlock <= currentBlock) {
      const toBlock = (fromBlock + CHUNK_SIZE) > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE;
      
      console.log(`Fetching events from block ${fromBlock} to ${toBlock}...`);
      
      try {
        const logs = await publicClient.getContractEvents({
          address: contractAddress,
          abi: contractAbi,
          eventName: 'stored',
          fromBlock: fromBlock,
          toBlock: toBlock
        });
        
        console.log(`Found ${logs.length} events in this chunk.`);
        allLogs = [...allLogs, ...logs];
        
      } catch (error) {
        console.error(`Error fetching events from block ${fromBlock} to ${toBlock}:`, error);
      }
      
      fromBlock = toBlock + 1n;
    }
    
    console.log(`Found ${allLogs.length} total past events:`);
    
    for (const log of allLogs) {
      console.log('Event:');
      console.log('  Block:', log.blockNumber);
      
      if (log.args) {
        console.log('  Address:', log.args._to || 'Not available');
        console.log('  Value:', log.args._amount ? log.args._amount.toString() : 'Not available');
      } else {
        console.log('  Args: Not available');
      }
      
      console.log('  Raw event data:', JSON.stringify(log, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));
    }
    
    return allLogs;
  } catch (error) {
    console.error('Error fetching past events:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('\n--- Reading Current Value ---');
    await readStoredValue();
    await readStoredDataVariable();
    
    console.log('\n--- Fetching Past Events ---');
    await getPastEvents();
    
    console.log('\n--- Updating Value ---');
    const newValue = 100;
    await updateStoredValue(newValue);
    
    console.log('\n--- Reading Updated Value ---');
    await readStoredValue();
    
    // console.log('\n--- Listening for New Events ---');
    // listenForStoredEvents();
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
