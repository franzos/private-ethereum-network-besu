# Besu Network with Docker Compose

This document explains how to use Docker Compose to run a private Besu network with 6 nodes.

## Prerequisites

- Docker and Docker Compose installed
- The network directory structure with node configurations already set up

## Network Structure

The Docker Compose configuration sets up:

- 6 Besu nodes (node-1 through node-6)
- Node-1 acts as the bootnode
- All nodes are connected via Docker's default bridge network
- Each node has its P2P and HTTP RPC ports mapped to the host

## Starting the Network

Before starting the network, you need to generate the environment file with the bootnode information:

```bash
# Generate .env file for Docker mode
./generate-env.sh docker
```

This will create an .env file with the bootnode enode URL that will be used by the other nodes.

Then, start the entire network:

```bash
docker-compose up -d
```

This will start all 6 nodes in detached mode. Node-1 will start first, and the other nodes will connect to it using the enode URL from the .env file.

## Using with Local (Non-Docker) Nodes

If you want to run some nodes locally (outside Docker) using the launch-node.sh script, you need to generate the environment file in local mode:

```bash
# Generate .env file for local mode
./generate-env.sh local
```

This will create an .env file with the bootnode enode URL using 127.0.0.1 as the host instead of node-1.

## Checking Node Status

To check the status of all nodes:

```bash
docker-compose ps
```

To view the logs of a specific node:

```bash
docker-compose logs node-1
```

Or to follow the logs:

```bash
docker-compose logs -f node-1
```

## Verifying the Network

Once all nodes are running, you can verify that they are connected by querying the validators:

```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"], "id":1}' localhost:8545
```

You should see all 6 validator addresses in the response.

You can also check the current block number:

```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[], "id":1}' localhost:8545
```

## Stopping the Network

To stop all nodes:

```bash
docker-compose down
```

## Configuration Details

### Ports

- Node-1: P2P port 30303, HTTP port 8545
- Node-2: P2P port 30304, HTTP port 8546
- Node-3: P2P port 30305, HTTP port 8547
- Node-4: P2P port 30306, HTTP port 8548
- Node-5: P2P port 30307, HTTP port 8549
- Node-6: P2P port 30308, HTTP port 8550

### Volumes

Each node has its data directory and genesis.json file mounted from the host to the container.

### Network

All nodes are connected to Docker's default bridge network, allowing them to communicate with each other and with other containers on the same host.

## Using with MetaMask

To connect MetaMask to your Besu network:

1. Add a new network with the following details:
   - Name: Besu DEV
   - New RPC URL: http://localhost:8545
   - Chain ID: 1337 (from your qbftConfigFile.json)
   - Currency Symbol: BESU

2. Import accounts using the private keys from the genesis.json file.
