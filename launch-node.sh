#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Error: Please provide a node name (e.g., node-2)"
  echo "Usage: $0 node-name"
  exit 1
fi

NODE_NAME="$1"
NODE_DIR="network/${NODE_NAME}"

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

guix shell openjdk -- ./besu/bin/besu \
  --data-path="${NODE_DIR}/data" \
  --genesis-file="${NODE_DIR}/genesis.json" \
  --rpc-http-enabled \
  --rpc-http-api=ETH,NET,QBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --bootnodes="${BOOTNODE}" \
  --p2p-port="${P2P_PORT}" \
  --rpc-http-port="${HTTP_PORT}"