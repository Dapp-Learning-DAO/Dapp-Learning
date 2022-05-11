#!/bin/bash
output=$(starknet deploy --contract starknet-artifacts/contracts/contract.cairo/contract.json --network alpha)
echo $output
deploy_tx_id=$(echo $output | sed -r "s/.*Transaction ID: (\w*).*/\1/")
address=$(echo $output | sed -r "s/.*Contract address: (\w*).*/\1/")
echo "Address: $address"
echo "tx_id: $deploy_tx_id"
starknet invoke --function increase_balance --inputs 10 20 --network alpha --address $address --abi starknet-artifacts/contracts/contract.cairo/contract_abi.json
#starknet tx_status --id $deploy_tx_id --network alpha
starknet call --function get_balance --network alpha --address $address --abi starknet-artifacts/contracts/contract.cairo/contract_abi.json
