# Private Ethereum Network with Besu (on Guix)

Instructions on how-to setup (and interact with) a private Ethereum network with proof of authority (QBFT) consensus algorithm using Besu.

This is guide is using Besu `25.2.2` but may work with other versions.

## Setup Besu

```bash
wget https://github.com/hyperledger/besu/releases/download/25.2.2/besu-25.2.2.zip
unzip besu-25.2.2.zip && mv besu-25.2.2 besu
```

Start a guix environment, and check if besu is running:

```bash
guix shell openjdk
./besu/bin/besu --version
```

## Configure the network

Create a genesis config `qbftConfigFile.json`:

```json
{
  "genesis": {
    "config": {
      "chainId": 1337,
      "grayGlacierBlock": 0,
      "qbft": {
        "blockperiodseconds": 2,
        "epochlength": 30000,
        "requesttimeoutseconds": 4
      }
    },
    "nonce": "0x0",
    "timestamp": "0x58ee40ba",
    "gasLimit": "0x47b760",
    "difficulty": "0x1",
    "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "alloc": {
      "fe3b557e8fb62b89f4916b721be55ceb828dbd73": {
        "privateKey": "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
        "comment": "private key and this comment are ignored.  In a real chain, the private key should NOT be stored",
        "balance": "0xad78ebc5ac6200000"
      },
      "627306090abaB3A6e1400e9345bC60c78a8BEf57": {
        "privateKey": "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
        "comment": "private key and this comment are ignored.  In a real chain, the private key should NOT be stored",
        "balance": "90000000000000000000000"
      },
      "f17f52151EbEF6C7334FAD080c5704D77216b732": {
        "privateKey": "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
        "comment": "private key and this comment are ignored.  In a real chain, the private key should NOT be stored",
        "balance": "90000000000000000000000"
      }
    }
  },
  "blockchain": {
    "nodes": {
      "generate": true,
      "count": 6
    }
  }
}
```

There's a couple of things to be aware:

- The `grayGlacierBlock` is the latest Ethereum milestone block. Replace it with whatever milestone to start with; Usually it's best to stick to the latest from [here](https://besu.hyperledger.org/23.7.2/public-networks/reference/genesis-items#milestone-blocks).

Create the file structure for nodes:

```bash
mkdir -p network/node-1/data network/node-2/data network/node-3/data network/node-4/data network/node-5/data network/node-6/data
```

Generate the keys for the nodes:

```bash
./besu/bin/besu operator generate-blockchain-config --config-file=qbftConfigFile.json --to=networkFiles --private-key-file-name=key

# Result
$ tree networkFiles/
networkFiles/
├── genesis.json
└── keys
    ├── 0x3630f48b632d998fa54fd2e08a77a627aabdbd77
    │   ├── key
    │   └── key.pub
    ├── 0x422ef4e30554229ee8bd7bd576bc28b95ba9a733
    │   ├── key
    │   └── key.pub
    ├── 0x628da40ed943b3f57813058808d35f08b9125402
    │   ├── key
    │   └── key.pub
    ├── 0x992fd1dad418738a6a4a83cc80b3cacc85963822
    │   ├── key
    │   └── key.pub
    ├── 0xa8f66aa0e453ba1ecd9a722a7cb69c2369305517
    │   ├── key
    │   └── key.pub
    └── 0xf7b6f5857b179f705277bb489164d0921b94eb7e
        ├── key
        └── key.pub
```


Move the keys and genesis.json to the respective node directories:

```bash
bash move-generated-files.sh

# Result
$ tree network/
network/
├── node-1
│   ├── data
│   │   ├── key
│   │   └── key.pub
│   ├── genesis.json
│   ├── http-port
│   └── p2p-port
├── node-2
│   ├── data
│   │   ├── key
│   │   └── key.pub
│   ├── genesis.json
│   ├── http-port
│   └── p2p-port
├── node-3
│   ├── data
│   │   ├── key
│   │   └── key.pub
│   ├── genesis.json
│   ├── http-port
│   └── p2p-port
├── node-4
│   ├── data
│   │   ├── key
│   │   └── key.pub
│   ├── genesis.json
│   ├── http-port
│   └── p2p-port
├── node-5
│   ├── data
│   │   ├── key
│   │   └── key.pub
│   ├── genesis.json
│   ├── http-port
│   └── p2p-port
└── node-6
    ├── data
    │   ├── key
    │   └── key.pub
    ├── genesis.json
    ├── http-port
    └── p2p-port

13 directories, 30 files
```

## Start the network

### Bootnode

Now you can start the first node, in a new terminal:

```bash
cd network/node-1
guix shell openjdk -- ../../besu/bin/besu --data-path=data --genesis-file=genesis.json --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT --host-allowlist="*" --rpc-http-cors-origins="all" --p2p-port=30303
```

Optionally, from the output, record the encode URL; For ex.:

```bash
2025-03-09 09:52:05.176+00:00 | main | INFO  | DefaultP2PNetwork | Enode URL enode://3b88135adbbeb081ec04c1ba403d6675af6200f031dfbc72c725adb0c3f5021cfbaca654798da6e59b0cfdb8c94b55b0fd83d0c895616dbb3de23d89f4597c5a@127.0.0.1:30303
```

### Nodes

Now to start the second node, in a new terminal:

```bash
cd network/node-2
guix shell openjdk -- ../../besu/bin/besu --data-path=data --genesis-file=genesis.json --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT --host-allowlist="*" --rpc-http-cors-origins="all" --bootnodes=enode://5b5a2ac557e8cb769afa6ca4bb33ba5218fe41c57ec1163db8efe757e74ccd37cdc02563b8073086a38dd31689b8a8c57f44dd252c69a044005af5ade7b389aa@127.0.0.1:30303 --p2p-port=30304 --rpc-http-port=8546
```

or use the provided script, each line in a new terminal:

```bash
bash launch-node.sh node-2
bash launch-node.sh node-3
bash launch-node.sh node-4
bash launch-node.sh node-5
bash launch-node.sh node-6
```

You can verify all peers are online:

```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"], "id":1}' localhost:8545
```

Result

```json
{
    "jsonrpc":"2.0",
    "id":1,
    "result": [
        "0x3630f48b632d998fa54fd2e08a77a627aabdbd77",
        "0x422ef4e30554229ee8bd7bd576bc28b95ba9a733",
        "0x628da40ed943b3f57813058808d35f08b9125402",
        "0x992fd1dad418738a6a4a83cc80b3cacc85963822",
        "0xa8f66aa0e453ba1ecd9a722a7cb69c2369305517",
        "0xf7b6f5857b179f705277bb489164d0921b94eb7e"
    ]
}
```

Within a couple of minutes, you should see the block number increasing:

```bash
2025-03-09 10:15:20.859+00:00 | EthScheduler-Timer-0 | INFO  | FullSyncTargetManager | Unable to find sync target. Waiting for 5 peers minimum. Currently checking 5 peers for usefulness
2025-03-09 10:15:21.664+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | BFT round summary (quorum = 4)
2025-03-09 10:15:21.664+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | Address: 0x992fd1dad418738a6a4a83cc80b3cacc85963822  Round: 5 (Local node)
2025-03-09 10:15:21.665+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | Address: 0xf7b6f5857b179f705277bb489164d0921b94eb7e  Round: 5
2025-03-09 10:15:21.665+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | Address: 0xa8f66aa0e453ba1ecd9a722a7cb69c2369305517  Round: 5
2025-03-09 10:15:21.665+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | Address: 0x3630f48b632d998fa54fd2e08a77a627aabdbd77  Round: 6
2025-03-09 10:15:21.665+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | Address: 0x422ef4e30554229ee8bd7bd576bc28b95ba9a733  Round: 6
2025-03-09 10:15:21.665+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | RoundChangeManager | Address: 0x628da40ed943b3f57813058808d35f08b9125402  Round: 5
2025-03-09 10:15:21.729+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | QbftRound | Importing proposed block to chain. round=ConsensusRoundIdentifier{Sequence=1, Round=5}, hash=0xc0871cb0bd986548a35f12aadb0174522e17c6d3ee28245ee13ac1b070bddc51
2025-03-09 10:15:21.789+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | QbftBesuControllerBuilder | Imported empty block #1 / 0 tx / 0 pending / 0 (0.0%) gas / (0xc0871cb0bd986548a35f12aadb0174522e17c6d3ee28245ee13ac1b070bddc51)
2025-03-09 10:15:23.068+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | QbftBesuControllerBuilder | Imported empty block #2 / 0 tx / 0 pending / 0 (0.0%) gas / (0x834df30d707f27f287f3c5f181546448da901bc2e384d3071c0cc482a16358c7)
2025-03-09 10:15:23.078+00:00 | EthScheduler-Workers-0 | INFO  | PersistBlockTask | Block 2 (0x834df30d707f27f287f3c5f181546448da901bc2e384d3071c0cc482a16358c7) is already imported
2025-03-09 10:15:25.074+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | QbftBesuControllerBuilder | Imported empty block #3 / 0 tx / 0 pending / 0 (0.0%) gas / (0xfb409380276bcfff61d3513ca41e76fc231586b3575276ac8333fda47979121c)
```

You can also check the block number:

```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[], "id":1}' localhost:8545
```

Result

```json
{"jsonrpc":"2.0","id":1,"result":"0x57"}
```

## Wallet

To play with the network on Metamask, add it as "Custom Network" with the following details:

- Name: Besu DEV
- New RPC URL: http://localhost:8545
- Chain ID: 1337
- Currency Symbol: BESU

Once you added the network, you can import the accounts using the private keys from the `genesis.json` file.

1. Add a new account
2. Import, and paste the private key from the `genesis.json` file
3. You should see the balance of the account (200 BESU)

Repeat this for the second account, and make a transfer between them; It should show-up in the logs:

```bash
2025-03-09 10:34:21.019+00:00 | BftProcessorExecutor-QBFT-0 | INFO  | QbftBesuControllerBuilder | Imported empty block #571 / 0 tx / 1 pending / 0 (0.0%) gas / (0xcde78d11808b554e55d83f843f3a160b0f413f2ad382ee6a5c9730956bacde88)
```

## Credits

This guide is based on [Create a private network using QBFT](https://besu.hyperledger.org/private-networks/tutorials/qbft)