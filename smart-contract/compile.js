const fs = require("fs").promises;
const constant = require('./constant.js');
const compile = require('../smart-contract-common/compile.js');

async function compileContract() {
  const sourceCode = await fs.readFile(`${constant.contractName}.sol`, "utf8");
  const { abi, bytecode } = compile(sourceCode, constant.contractName);
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile(`${constant.contractName}.json`, artifact);
}

compileContract().catch(console.error);
