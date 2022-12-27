pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CommitmentVerifier() {
    //Private inputs
    signal input nullifier;
    signal input secret;
    signal input newNullifier;
    signal input newSecret;
    //Public inputs
    signal input commitment;
    signal input newCommitment;

    //Verify that nullifier + secret --> commitment. Use poseiden hash
    component oldPoseidon = Poseidon(2);
    oldPoseidon.inputs[0] <== nullifier;
    oldPoseidon.inputs[1] <== secret;
    
    commitment === oldPoseidon.out;
    
    //Verify that nullifier + secret --> commitment. Use poseiden hash
    component newPoseidon = Poseidon(2);
    newPoseidon.inputs[0] <== newNullifier;
    newPoseidon.inputs[1] <== newSecret;

    newCommitment === newPoseidon.out; 
}

component main{public [commitment, newCommitment]} = CommitmentVerifier();