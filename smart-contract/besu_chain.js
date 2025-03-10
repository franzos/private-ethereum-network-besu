const { defineChain } = require('viem');

const besuChain = defineChain({
  id: 1337,
  name: 'besu',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8546'],
    },
  },
});

module.exports = besuChain;