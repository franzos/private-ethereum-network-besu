const fs = require("fs");
const constant = require('./constant.js');
const compile = require('../smart-contract-common/compile.js');

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

async function compileContract() {
  const sourceCode = fs.readFileSync(`${constant.contractName}.sol`, "utf8");
  const { abi, bytecode } = compile(sourceCode, constant.contractName, findImports);
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  fs.writeFileSync(`${constant.contractName}.json`, artifact);
}

compileContract().catch(console.error);
