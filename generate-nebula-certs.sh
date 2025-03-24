#!/bin/bash

set -e

# Configuration
NUM_NODES=6
NEBULA_NETWORK="192.168.100.0/24"
NEBULA_PORT=4242
CA_NAME="Besu-Network-CA"
GROUP_NAME="besu"

# Create directories
mkdir -p nebula-certs
mkdir -p nebula-configs

echo "Generating Nebula Certificate Authority..."
guix shell nebula -- nebula-cert ca -name "$CA_NAME" -out-crt nebula-certs/ca.crt -out-key nebula-certs/ca.key

# Generate certificates and configs for each node
for ((i=1; i<=NUM_NODES; i++)); do
  NODE_NAME="node-$i"
  NODE_IP="192.168.100.10$i"
  NODE_DIR="network/$NODE_NAME"
  NODE_DATA_DIR="$NODE_DIR/data"
  
  echo "Generating certificate for $NODE_NAME with IP $NODE_IP..."
  
  # Generate certificate for the node
  guix shell nebula -- nebula-cert sign \
    -name "$NODE_NAME" \
    -ip "$NODE_IP/24" \
    -groups "$GROUP_NAME" \
    -out-crt "nebula-certs/$NODE_NAME.crt" \
    -out-key "nebula-certs/$NODE_NAME.key" \
    -ca-crt nebula-certs/ca.crt \
    -ca-key nebula-certs/ca.key
  
  # Create static host map entries for config
  STATIC_HOST_MAP=""
  for ((j=1; j<=NUM_NODES; j++)); do
    if [ $j -ne $i ]; then
      STATIC_HOST_MAP="${STATIC_HOST_MAP}  \"192.168.100.10$j\": [\"NODE${j}_REAL_IP:$NEBULA_PORT\"]\n"
    fi
  done
  
  # Create config file
  cat > "nebula-configs/$NODE_NAME.yml" << EOF
pki:
  ca: /etc/nebula/ca.crt
  cert: /etc/nebula/node-$i.crt
  key: /etc/nebula/node-$i.key

static_host_map:
$(echo -e "$STATIC_HOST_MAP")

lighthouse:
  am_lighthouse: false
  interval: 60

listen:
  host: 0.0.0.0
  port: $NEBULA_PORT

punchy:
  punch: true

firewall:
  outbound:
    - port: any
      proto: any
      host: any
  inbound:
    - port: any
      proto: any
      groups:
        - $GROUP_NAME
EOF

  # Check if node directory exists
  if [ ! -d "$NODE_DATA_DIR" ]; then
    echo "Warning: Node directory $NODE_DATA_DIR doesn't exist. Creating it..."
    mkdir -p "$NODE_DATA_DIR"
  fi
  
  # Copy files to node data directory
  echo "Copying Nebula files to $NODE_DATA_DIR..."
  cp "nebula-certs/ca.crt" "$NODE_DATA_DIR/"
  cp "nebula-certs/$NODE_NAME.crt" "$NODE_DATA_DIR/"
  cp "nebula-certs/$NODE_NAME.key" "$NODE_DATA_DIR/"
  cp "nebula-configs/$NODE_NAME.yml" "$NODE_DATA_DIR/nebula.yml"
  
  echo "Completed setup for $NODE_NAME"
  echo "----------------------------------------"
done

echo "Nebula certificate generation complete!"
echo "CA and node certificates have been generated and placed in each node's data directory."
echo "The configuration files use paths that will work when copied to remote hosts (/etc/nebula/...)."
echo "You may need to adjust the static_host_map in the config files with actual IP addresses when deploying."
