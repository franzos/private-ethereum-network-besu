const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const chain = require('./besu_chain.js');

const privateKey = '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f';
const account = privateKeyToAccount(privateKey);

const walletClient = createWalletClient({
  transport: http(chain.rpcUrls.default.http[0]),
  chain,
  account
});

module.exports = {
    walletClient,
    account,
    privateKey
};