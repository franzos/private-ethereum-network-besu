const fs = require('fs');
const path = require('path');
const { parseAbi } = require('viem');

const publicClient = require('../smart-contract-common/public_client.js');
const private = require('../smart-contract-common/private_client.js');

// Load contract address
let contractAddress;
try {
  contractAddress = fs.readFileSync(path.join(__dirname, 'contract_address'), 'utf8').trim();
  console.log('NFT Contract address loaded from file:', contractAddress);
} catch (error) {
  console.error('Error reading contract address from file:', error);
  console.error('Please make sure the contract_address file exists in the smart-contract-erc721 directory');
  process.exit(1);
}

// Load contract ABI from the JSON file
let contractAbi;
try {
  const contractArtifactPath = path.join(__dirname, 'TestNFT.json');
  const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath, 'utf8'));
  contractAbi = contractArtifact.abi;
  console.log('Contract ABI loaded from TestNFT.json');
} catch (error) {
  console.error('Error loading contract ABI from TestNFT.json:', error);
  console.error('Falling back to manually defined ABI');
  
  // Fallback to manually defined ABI
  contractAbi = parseAbi([
    'function mintNFT(address recipient, string memory tokenURI) public returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function balanceOf(address owner) view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function owner() view returns (address)',
    'function supportsInterface(bytes4 interfaceId) view returns (bool)'
  ]);
}

// Get contract information
async function getContractInfo() {
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
    
    console.log('NFT Contract Name:', name);
    console.log('NFT Contract Symbol:', symbol);
  } catch (error) {
    console.error('Error getting contract info:', error);
  }
}

// Check if the current account is the contract owner
async function isContractOwner() {
  try {
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'owner'
    });
    
    return owner.toLowerCase() === private.account.address.toLowerCase();
  } catch (error) {
    console.error('Error checking contract owner:', error);
    return false;
  }
}

// Mint a new NFT
async function mintNFT(recipient, tokenURI) {
  try {
    console.log(`Minting NFT to ${recipient} with URI: ${tokenURI}`);
    
    // Check if the current account is the contract owner
    const isOwner = await isContractOwner();
    if (!isOwner) {
      throw new Error('The current account is not the contract owner. Only the owner can mint NFTs.');
    }
    
    const hash = await private.walletClient.writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'mintNFT',
      args: [recipient, tokenURI]
    });
    
    console.log('Transaction hash:', hash);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // Parse logs to find the token ID
    // This is a simplified approach - in a real app, you'd want to decode the event logs properly
    console.log('Transaction receipt:', receipt);
    
    return hash;
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
}

// Get token owner
async function getTokenOwner(tokenId) {
  try {
    // Ensure tokenId is a BigInt
    const tokenIdBigInt = BigInt(tokenId);
    
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'ownerOf',
      args: [tokenIdBigInt]
    });
    
    console.log(`Owner of token #${tokenId}: ${owner}`);
    return owner;
  } catch (error) {
    console.error(`Error getting owner of token #${tokenId}:`, error);
    throw error;
  }
}

// Get token URI
async function getTokenURI(tokenId) {
  try {
    // Ensure tokenId is a BigInt
    const tokenIdBigInt = BigInt(tokenId);
    
    const uri = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'tokenURI',
      args: [tokenIdBigInt]
    });
    
    console.log(`URI of token #${tokenId}: ${uri}`);
    return uri;
  } catch (error) {
    console.error(`Error getting URI of token #${tokenId}:`, error);
    throw error;
  }
}

// Get balance of address
async function getBalance(address) {
  try {
    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'balanceOf',
      args: [address]
    });
    
    console.log(`NFT balance of ${address}: ${balance.toString()}`);
    return balance;
  } catch (error) {
    console.error(`Error getting balance of ${address}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Try to get the contract owner first
    console.log('\n--- Checking Contract Owner ---');
    try {
      const owner = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'owner'
      });
      console.log('Contract owner:', owner);
      
      // Check if the current account is the owner
      const isOwner = owner.toLowerCase() === private.account.address.toLowerCase();
      console.log('Current account is owner:', isOwner);
      
      if (!isOwner) {
        console.warn('Warning: The current account is not the contract owner. Only the owner can mint NFTs.');
      }
    } catch (ownerError) {
      console.error('Error getting contract owner:', ownerError);
      console.warn('Warning: Could not verify if current account is the contract owner.');
    }
    
    // Try to check if the contract supports the ERC721 interface
    console.log('\n--- Checking Interface Support ---');
    try {
      // ERC721 interface ID: 0x80ac58cd
      const supportsERC721 = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'supportsInterface',
        args: ['0x80ac58cd']
      });
      console.log('Supports ERC721:', supportsERC721);
      
      if (!supportsERC721) {
        console.warn('Warning: Contract does not support the ERC721 interface.');
      }
    } catch (interfaceError) {
      console.error('Error checking interface support:', interfaceError);
    }
    
    // Mint a new NFT
    console.log('\n--- Minting New NFT ---');
    const sampleMetadataURI = 'https://example.com/metadata/1';
    
    try {
      await mintNFT(private.account.address, sampleMetadataURI);
      console.log('NFT minting initiated');
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for potential reuse
module.exports = {
  mintNFT,
  getTokenOwner,
  getTokenURI,
  getBalance,
  getContractInfo,
  isContractOwner
};
