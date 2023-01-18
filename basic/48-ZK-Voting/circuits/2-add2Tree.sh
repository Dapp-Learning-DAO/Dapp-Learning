
# add2Tree compile & setup

# compile circom
echo "compile circom"
circom add2Tree/add2Tree.circom --r1cs --wasm --sym -o add2Tree/

# phase2
echo "setup phase2"
snarkjs groth16 setup add2Tree/add2Tree.r1cs pot12_final.ptau add2Tree/add2Tree_0000.zkey
snarkjs zkey contribute add2Tree/add2Tree_0000.zkey add2Tree/add2Tree_0001.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey add2Tree/add2Tree_0001.zkey add2Tree/verification_key.json

# Generate a Smart Contract
echo "Generate Smart Contract"
snarkjs zkey export solidityverifier add2Tree/add2Tree_0001.zkey ../contracts/Add2TreeVerifier.sol


# computing witness
echo "computing witness 00"
node add2Tree/add2Tree_js/generate_witness.js add2Tree/add2Tree_js/add2Tree.wasm \
add2Tree/input_00.json add2Tree/witness_00.wtns

# Generating a Proof
echo "Generating a Proof 00"
snarkjs groth16 prove add2Tree/add2Tree_0001.zkey add2Tree/witness_00.wtns add2Tree/proof_00.json add2Tree/public_00.json

# Verifying a Proof
echo "Verifying a Proof 00"
snarkjs groth16 verify add2Tree/verification_key.json add2Tree/public_00.json add2Tree/proof_00.json

echo "verify calldata 00:\n"
snarkjs zkey export soliditycalldata add2Tree/public_00.json add2Tree/proof_00.json


# computing witness
echo "computing witness 01"
node add2Tree/add2Tree_js/generate_witness.js add2Tree/add2Tree_js/add2Tree.wasm \
add2Tree/input_01.json add2Tree/witness_01.wtns

# Generating a Proof
echo "Generating a Proof 01"
snarkjs groth16 prove add2Tree/add2Tree_0001.zkey add2Tree/witness_01.wtns add2Tree/proof_01.json add2Tree/public_01.json

# Verifying a Proof
echo "Verifying a Proof 01"
snarkjs groth16 verify add2Tree/verification_key.json add2Tree/public_01.json add2Tree/proof_01.json

echo "verify calldata 01:\n"
snarkjs zkey export soliditycalldata add2Tree/public_01.json add2Tree/proof_01.json