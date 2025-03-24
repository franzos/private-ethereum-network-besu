const fs = require("fs").promises;
const path = require("path");
const solc = require("solc");
const fsSync = require("fs");

async function main() {
  const sourceCode = await fs.readFile("TestNFT.sol", "utf8");
  const { abi, bytecode } = compile(sourceCode, "TestNFT");
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile("TestNFT.json", artifact);
}

function compile(sourceCode, contractName) {
  const input = {
    language: "Solidity",
    sources: { "TestNFT.sol": { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };

  // Import resolver function for OpenZeppelin dependencies
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

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    output.errors.forEach(err => {
      const type = err.severity === "error" ? "Error" : "Warning";
      console.error(`${type}: ${err.formattedMessage}`);
    });
    if (output.errors.some(err => err.severity === "error")) {
      throw new Error("Compilation failed due to errors.");
    }
  }

  if (!output.contracts || !output.contracts["TestNFT.sol"]) {
    throw new Error("Compilation failed or contract not found in output.");
  }

  const artifact = output.contracts["TestNFT.sol"][contractName];
  if (!artifact) {
    throw new Error(`Contract ${contractName} not found in compiled output.`);
  }

  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
}).then(() => {
  console.log(`Contract compiled and saved to TestNFT.json.`);
  process.exit(0);
});
