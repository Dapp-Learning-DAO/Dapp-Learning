
# proveInTree compile & setup

# compile circom
echo "compile circom"
circom proveInTree/proveInTree.circom --r1cs --wasm --sym -o proveInTree/


# phase2
echo "setup phase2"
snarkjs groth16 setup proveInTree/proveInTree.r1cs pot12_final.ptau proveInTree/proveInTree_0000.zkey
snarkjs zkey contribute proveInTree/proveInTree_0000.zkey proveInTree/proveInTree_0001.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey proveInTree/proveInTree_0001.zkey proveInTree/verification_key.json

# Generate a Smart Contract
echo "Generate Smart Contract"
snarkjs zkey export solidityverifier proveInTree/proveInTree_0001.zkey ../contracts/ProveInTreeVerifier.sol


# computing witness
echo "computing witness 00"
node proveInTree/proveInTree_js/generate_witness.js proveInTree/proveInTree_js/proveInTree.wasm \
    proveInTree/input_00.json proveInTree/witness_00.wtns

# Generating a Proof
echo "Generating a Proof 00"
snarkjs groth16 prove proveInTree/proveInTree_0001.zkey proveInTree/witness_00.wtns proveInTree/proof_00.json proveInTree/public_00.json

# Verifying a Proof
echo "Verifying a Proof 00"
snarkjs groth16 verify proveInTree/verification_key.json proveInTree/public_00.json proveInTree/proof_00.json

echo "verify calldata 00:\n"
snarkjs zkey export soliditycalldata proveInTree/public_00.json proveInTree/proof_00.json

# computing witness
echo "computing witness 01"
node proveInTree/proveInTree_js/generate_witness.js proveInTree/proveInTree_js/proveInTree.wasm \
proveInTree/input_01.json proveInTree/witness_01.wtns

# Generating a Proof
echo "Generating a Proof 01"
snarkjs groth16 prove proveInTree/proveInTree_0001.zkey proveInTree/witness_01.wtns proveInTree/proof_01.json proveInTree/public_01.json

# Verifying a Proof
echo "Verifying a Proof 01"
snarkjs groth16 verify proveInTree/verification_key.json proveInTree/public_01.json proveInTree/proof_01.json

echo "verify calldata 01:\n"
snarkjs zkey export soliditycalldata proveInTree/public_01.json proveInTree/proof_01.json