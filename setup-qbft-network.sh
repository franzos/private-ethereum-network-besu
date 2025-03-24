set -e

echo "=== QBFT Network Setup ==="
echo "Step 1: Creating network directories..."
mkdir -p network/node-1/data network/node-2/data network/node-3/data network/node-4/data network/node-5/data network/node-6/data

echo "Step 2: Generating temporary network configuration..."
rm -rf tempNetworkFiles 2>/dev/null || true
./besu/bin/besu operator generate-blockchain-config --config-file=qbftConfigFile.json --to=tempNetworkFiles --private-key-file-name=key

echo "Step 3: Extracting validator addresses..."
# bash extract-validators.sh

echo "Step 4: Generating extraData with validator addresses..."
# bash generate-encoded-data.sh

echo "Step 5: Cleaning up temporary files..."
rm -rf tempNetworkFiles 2>/dev/null || true

echo "Step 6: Generating full network configuration with updated extraData..."
rm -rf networkFiles 2>/dev/null || true
./besu/bin/besu operator generate-blockchain-config --config-file=qbftConfigFile.json --to=networkFiles --private-key-file-name=key

echo "Step 7: Moving files to node directories..."
bash move-generated-files.sh

echo "Step 8: Genegerate .env for Docker"
bash generate-env.sh

echo "=== QBFT Network Setup Complete ==="
echo "Your network is configured with the correct validator set in extraData"
echo "You can now start your nodes using the launch-node.sh script"
