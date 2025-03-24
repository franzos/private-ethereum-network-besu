const { createPublicClient, http } = require('viem');
const chain = require('./besu_chain.js');

const publicClient = createPublicClient({
    transport: http(chain.rpcUrls.default.http[0]),
    chain
});

module.exports = publicClient;