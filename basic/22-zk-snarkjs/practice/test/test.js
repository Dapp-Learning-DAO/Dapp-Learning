const chai = require("chai");
const { before } = require("mocha");
const path = require("path");
const {buildPoseidonOpt} = require('circomlibjs');
// const snarkjs = require('snarkjs');
// const fs = require('fs');
const wasm_tester = require("circom_tester").wasm;

describe('verify hash', ()=>{
    let circuit;
    let poseidon;
    before(async()=>{
        circuit = await wasm_tester(path.join(__dirname, "../circuits", "circuit.circom"));
        poseidon = await buildPoseidonOpt();
    })

    it('should pass test', async ()=>{
        //Create input
        const data = buf2hex([1,1,1]);//byte array cannot be converted to BigInt directly, so we use hex
        const dataHash = buf2hex(await goodPoseidon(poseidon, [data]));//byte array cannot be converted to BigInt directly, so we use hex
        const input = {
            data,
            dataHash
        }
        var witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {out: "0"});

    })
});


function buf2hex(buffer) { // buffer is an ArrayBuffer
    return "0x"+[...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }
  
async function goodPoseidon(poseidon, input){
    const ansInFF = poseidon(input);
    return (await poseidon.F.batchFromMontgomery(ansInFF)).reverse()
}