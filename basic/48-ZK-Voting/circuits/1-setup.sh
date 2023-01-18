# powers of Tau
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# phase2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# generate input.json
node ./generate_input.js
