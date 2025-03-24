const fs = require("fs").promises;
const path = require("path");
const fsSync = require("fs");
const constant = require('./constant.js');
const compile = require('../smart-contract-common/compile.js');

function findImports(importPath) {
  let fullPath;
  if (importPath.startsWith('@openzeppelin/')) {
    // Import from node_modules for @openzeppelin imports
    fullPath = path.resolve(__dirname, 'node_modules', importPath);
    
    // Check if the path exists - handle the case for ERC721URIStorage in v4
    if (importPath.includes('ERC721URIStorage') && !fsSync.existsSync(fullPath)) {
      const alternativePath = importPath.replace(
        'token/ERC721/ERC721URIStorage', 
        'token/ERC721/extensions/ERC721URIStorage'
      );
      const altFullPath = path.resolve(__dirname, 'node_modules', alternativePath);
      
      if (fsSync.existsSync(altFullPath)) {
        fullPath = altFullPath;
      }
    }
  } else {
    // For local imports
    fullPath = path.resolve(__dirname, importPath);
  }
  
  try {
    // Read the file content
    const content = fsSync.readFileSync(fullPath, 'utf8');
    return { contents: content };
  } catch (error) {
    console.error(`Failed to resolve import ${importPath}: ${error.message}`);
    console.error(`Make sure you have installed the correct version of @openzeppelin/contracts`);
    return { error: `File not found: ${importPath}` };
  }
}

async function compileContract() {
  const sourceCode = await fs.readFile(`${constant.contractName}.sol`, "utf8");
  const { abi, bytecode } = compile(sourceCode, constant.contractName, findImports);
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile(`${constant.contractName}.json`, artifact);
}

compileContract().catch(console.error);
