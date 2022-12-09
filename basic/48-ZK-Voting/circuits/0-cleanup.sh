# clean up

# add2Tree
rm -rf ./add2Tree/add2Tree_js/*
rm -rf ./add2Tree/*.zkey
rm -rf ./add2Tree/*.r1cs
rm -rf ./add2Tree/*.sym
rm -rf ./add2Tree/*.sol
rm -rf ./add2Tree/proof_*.json
rm -rf ./add2Tree/public_*.json
rm -rf ./add2Tree/verification_key.json
rm -rf ./add2Tree/*.wtns
rm -rf ./add2Tree/input_*.json


# proveInTree
rm -rf ./proveInTree/proveInTree_js/*
rm -rf ./proveInTree/*.zkey
rm -rf ./proveInTree/*.r1cs
rm -rf ./proveInTree/*.sym
rm -rf ./proveInTree/*.sol
rm -rf ./proveInTree/proof_*.json
rm -rf ./proveInTree/public_*.json
rm -rf ./proveInTree/verification_key.json
rm -rf ./proveInTree/*.wtns
rm -rf ./proveInTree/input_*.json

# Verifier contracts
rm -rf ../contracts/Add2TreeVerifier.sol
rm -rf ../contracts/ProveInTreeVerifier.sol
