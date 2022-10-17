

# 指令速查


```
circom circuit.circom --r1cs --wasm --sym

node circuit_js/generate_witness.js circuit_js/circuit.wasm input.json witness.wtns

snarkjs powersoftau new bn128 12 pot12_0000.ptau -v 
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v 
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v 
snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey 
snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="First contribution" -v
snarkjs zkey export verificationkey circuit_0001.zkey verification_key.json

snarkjs groth16 prove circuit_0001.zkey witness.wtns proof.json public.json

snarkjs groth16 verify verification_key.json public.json proof.json

```
