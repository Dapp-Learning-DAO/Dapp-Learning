pragma circom 2.0.0;

include "../circomlib/circuits/poseidon.circom";

template PreImage() {
    signal input preimage;
    signal input hash;

    component poseidonHasher = Poseidon(1);
    poseidonHasher.inputs[0]<==preimage;

    log(poseidonHasher.out);
    hash === poseidonHasher.out;
   
}

component main{public [hash]} = PreImage();