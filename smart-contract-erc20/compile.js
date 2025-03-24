const fs = require("fs");
const solc = require("solc");

async function main() {
  const sourceCode = fs.readFileSync("TestToken.sol", "utf8");
  const { abi, bytecode } = compile(sourceCode, "TestToken");
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  fs.writeFileSync("TestToken.json", artifact);
}

function compile(sourceCode, contractName) {
  // Find import paths for OpenZeppelin contracts
  function findImports(path) {
    try {
      // Resolve OpenZeppelin imports from node_modules
      if (path.startsWith('@openzeppelin/')) {
        const importPath = path.replace('@openzeppelin/', 'node_modules/@openzeppelin/');
        return { contents: fs.readFileSync(importPath, 'utf8') };
      }
      return { error: `File not found: ${path}` };
    } catch (error) {
      return { error: `Error reading file: ${error.message}` };
    }
  }

  const input = {
    language: "Solidity",
    sources: { "TestToken.sol": { content: sourceCode } },
    settings: { 
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  };

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

  if (!output.contracts || !output.contracts["TestToken.sol"]) {
    throw new Error("Compilation failed or contract not found in output.");
  }

  const artifact = output.contracts["TestToken.sol"][contractName];
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
  console.log(`Contract compiled and saved to TestToken.json.`);
  process.exit(0);
});
