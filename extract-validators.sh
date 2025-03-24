set -e

echo "Extracting validator addresses from temporary keys..."

# Create an array to store validator addresses
declare -a validator_addresses

# Get all key directories
key_dirs=(tempNetworkFiles/keys/*)

for i in "${!key_dirs[@]}"; do
  node_num=$((i+1))
  source_dir="${key_dirs[$i]}"
  
  echo "Processing key from ${source_dir}..."
  
  # Extract validator address from the node's key file
  if [ -f "${source_dir}/key" ]; then
    # Extract public key from the node's key file and convert to address
    # Redirect stderr to /dev/null and get only the last line which should be the address
    validator_address=$(./besu/bin/besu public-key export-address --node-private-key-file="${source_dir}/key" 2>/dev/null | tail -n 1)
    validator_addresses+=("\"$validator_address\"")
    echo "Extracted validator address for node-${node_num}: ${validator_address}"
  else
    echo "Warning: Could not find key file for node-${node_num}"
  fi
done

# Create validators.json file
echo "[" > validators.json
for i in "${!validator_addresses[@]}"; do
  if [ $i -eq $((${#validator_addresses[@]}-1)) ]; then
    # Last element, no comma
    echo "  ${validator_addresses[$i]}" >> validators.json
  else
    echo "  ${validator_addresses[$i]}," >> validators.json
  fi
done
echo "]" >> validators.json

echo "Created validators.json with ${#validator_addresses[@]} validator addresses"
