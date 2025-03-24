set -e

# Check if validators.json exists
if [ ! -f "validators.json" ]; then
  echo "Error: validators.json not found. Run move-generated-files.sh first."
  exit 1
fi

if [ ! -f "./besu/bin/besu" ]; then
  echo "Error: Besu binary not found at ./besu/bin/besu"
  echo "Please make sure Besu is installed correctly"
  exit 1
fi

# Generate RLP-encoded extraData
echo "Generating RLP-encoded extraData for QBFT..."
rlp_encoded=$(./besu/bin/besu rlp encode --from=validators.json --type=QBFT_EXTRA_DATA 2>/dev/null)

if [ -z "$rlp_encoded" ]; then
  echo "Error: Failed to generate RLP-encoded data"
  exit 1
fi

echo "Successfully generated RLP-encoded extraData:"
echo "$rlp_encoded"

# Update the genesis file with the new extraData
# This assumes your genesis file is in a standard location
genesis_file="qbftConfigFile.json"

if [ -f "$genesis_file" ]; then
  # Create a backup of the original file
  cp "$genesis_file" "${genesis_file}.bak"
  
  # Update the extraData field in the genesis file
  # This uses jq for JSON manipulation
  jq --arg extraData "$rlp_encoded" '.genesis.extraData = $extraData' "$genesis_file" > "${genesis_file}.tmp" && mv "${genesis_file}.tmp" "$genesis_file"
  
  echo "Updated $genesis_file with new extraData"
  echo "Original file backed up as ${genesis_file}.bak"
else
  echo "Genesis file $genesis_file not found."
  echo "Please manually add the following extraData to your genesis file:"
  echo "$rlp_encoded"
fi

echo "RLP-encoded extraData generation complete"
