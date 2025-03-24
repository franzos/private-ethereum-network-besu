const fs = require("fs");
const solc = require("solc");

function compile(sourceCode, contractName, findImports = undefined) {
  const input = {
    language: "Solidity",
    sources: { [`${contractName}.sol`]: { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };

  const output = findImports ? JSON.parse(solc.compile(JSON.stringify(input), { import: findImports })) : JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach(err => {
      const type = err.severity === "error" ? "Error" : "Warning";
      console.error(`${type}: ${err.formattedMessage}`);
    });
    if (output.errors.some(err => err.severity === "error")) {
      throw new Error("Compilation failed due to errors.");
    }
  }

  if (!output.contracts || !output.contracts[`${contractName}.sol`]) {
    throw new Error("Compilation failed or contract not found in output.");
  }

  const artifact = output.contracts[`${contractName}.sol`][contractName];
  if (!artifact) {
    throw new Error(`Contract ${contractName} not found in compiled output.`);
  }

  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

module.exports = compile;