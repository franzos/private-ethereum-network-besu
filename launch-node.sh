#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Error: Please provide a node name (e.g., node-2)"
  echo "Usage: $0 node-name [rpc-http-host [http-api-params]]"
  echo "  - node-name: Required. The name of the node to launch."
  echo "  - rpc-http-host: Optional. Default is 127.0.0.1"
  echo "  - http-api-params: Optional. Default is ETH,NET,QBFT,WEB3"
  exit 1
fi

if [ ! -f "./besu/bin/besu" ]; then
  echo "Error: Besu binary not found at ./besu/bin/besu"
  echo "Please make sure Besu is installed correctly"
  exit 1
fi

NODE_NAME="$1"
NODE_DIR="network/${NODE_NAME}"

# Set default RPC host to 127.0.0.1 if not specified
RPC_HOST="${2:-127.0.0.1}"

# Set default API parameters if not specified
API_PARAMS="${3:-ETH,NET,QBFT,WEB3}"

if [ "$NODE_NAME" = "node-1" ]; then
  echo "Error: This script is not meant for node-1, which should be launched separately as the bootnode"
  echo "Use this script only for node-2 and higher"
  exit 1
fi

if [ ! -d "$NODE_DIR" ]; then
  echo "Error: Node directory ${NODE_DIR} doesn't exist"
  exit 1
fi

P2P_PORT=$(cat "${NODE_DIR}/p2p-port")
HTTP_PORT=$(cat "${NODE_DIR}/http-port")

BOOTNODE_KEY_PATH="network/node-1/data/key.pub"
if [ ! -f "$BOOTNODE_KEY_PATH" ]; then
  echo "Error: Bootnode key file not found at ${BOOTNODE_KEY_PATH}"
  exit 1
fi

BOOTNODE_KEY=$(cat "$BOOTNODE_KEY_PATH" | sed 's/^0x//')
BOOTNODE_P2P_PORT=$(cat "network/node-1/p2p-port")

BOOTNODE="enode://${BOOTNODE_KEY}@127.0.0.1:${BOOTNODE_P2P_PORT}"

echo "Launching ${NODE_NAME} with p2p port ${P2P_PORT} and http port ${HTTP_PORT}"
echo "Using bootnode: ${BOOTNODE}"
echo "Using RPC HTTP host: ${RPC_HOST}"
echo "Using HTTP API parameters: ${API_PARAMS}"

# https://besu.hyperledger.org/24.7.0/public-networks/reference/cli/options#rpc-http-api
guix shell openjdk -- ./besu/bin/besu \
  --data-path="${NODE_DIR}/data" \
  --genesis-file="${NODE_DIR}/genesis.json" \
  --rpc-http-enabled \
  --rpc-http-host="${RPC_HOST}" \
  --rpc-http-api="${API_PARAMS}" \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --bootnodes="${BOOTNODE}" \
  --p2p-port="${P2P_PORT}" \
  --rpc-http-port="${HTTP_PORT}"