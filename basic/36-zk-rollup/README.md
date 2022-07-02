# Zk-rollup


## 执行步骤
1. compile 
```
    circom sample_circuit.circom -o circuit.json
```

2. Generate your input for the circuit
```
node generate_circuit_input.js
```

3. Calculate the witness for the circuit
```
snarkjs calculatewitness -c circuit.json -i input.json

```

4. Perform trusted setup
```
snarkjs setup -c circuit.json --protocol groth
```

5. Generate the proof
```
snarkjs proof -w witness.json --pk proving_key.json
```

6. Verify the proof

```
snarkjs verify
```
## 参考文档
- ZkRollup Tutorial: https://keen-noyce-c29dfa.netlify.app/#3


