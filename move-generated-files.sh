#!/bin/bash

set -e

key_dirs=(networkFiles/keys/*)
first_p2p_port=30303
first_http_port=8545

# if [ ${#key_dirs[@]} -ne 4 ]; then
#   echo "Warning: Found ${#key_dirs[@]} key directories, but expected 4 nodes"
# fi

for i in "${!key_dirs[@]}"; do
  node_num=$((i+1))
  source_dir="${key_dirs[$i]}"
  node_dir="network/node-${node_num}"
  node_data_dir="${node_dir}/data"
  
  p2p_port=$((first_p2p_port + i))
  http_port=$((first_http_port + i))
  
  echo "Moving contents from ${source_dir} to ${node_data_dir}"
  cp -r "${source_dir}"/* "${node_data_dir}/"
  cp networkFiles/genesis.json "$node_dir"
  
  echo "${p2p_port}" > "${node_dir}/p2p-port"
  echo "Set p2p port for node-${node_num} to ${p2p_port}"

  echo "${http_port}" > "${node_dir}/http-port"
  echo "Set http port for node-${node_num} to ${http_port}"
done

rm -rf networkFiles

echo "Files have been moved to node directories"