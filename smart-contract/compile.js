const fs = require("fs").promises;
const solc = require("solc");

async function main() {
  const sourceCode = await fs.readFile("StorageExample.sol", "utf8");
  const { abi, bytecode } = compile(sourceCode, "StorageExample");
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile("StorageExample.json", artifact);
}

function compile(sourceCode, contractName) {
  const input = {
    language: "Solidity",
    sources: { "StorageExample.sol": { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach(err => {
      const type = err.severity === "error" ? "Error" : "Warning";
      console.error(`${type}: ${err.formattedMessage}`);
    });
    if (output.errors.some(err => err.severity === "error")) {
      throw new Error("Compilation failed due to errors.");
    }
  }

  if (!output.contracts || !output.contracts["StorageExample.sol"]) {
    throw new Error("Compilation failed or contract not found in output.");
  }

  const artifact = output.contracts["StorageExample.sol"][contractName];
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
  console.log(`Contract compiled and saved to StorageExample.json.`);
  process.exit(0);
});