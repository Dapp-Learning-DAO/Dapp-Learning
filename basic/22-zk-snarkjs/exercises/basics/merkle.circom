pragma circom 2.0.0;

include "../circomlib/circuits/mimcsponge.circom";
//mimcsponge is a zk-friendly 

template DoHash(nInputs) {
    signal input in[nInputs];
    signal output hash;

    component mimcHasher = MiMCSponge(nInputs, 220, 1); 

    for (var i =0;i<nInputs;i++) {
        mimcHasher.ins[i] <== in[i] ;
    }   
    mimcHasher.k <== 123;

    hash <== mimcHasher.outs[0];
}

//force it so that out[0] is left hash while out[1] is right hash
template DualMux() {
    signal input in[2];//in[1] is proof
    signal input s;
    signal output out[2];

    out[0] <== (in[0]-in[1])*s + in[1];
    out[1] <== (in[1]-in[0])*s + in[0];
}

template MerkleTree(levels) {
    signal input leaf;
    signal input proofs[levels];
    signal input proofsAtRight[levels];
    signal input root;

    //convert leaf to leaf hash
    component hasher = DoHash(1);
    hasher.in[0] <== leaf;
    signal leafHash <== hasher.hash;
    //construct root from bottom to up
    component hashers[levels];
    component dualMux[levels];
    var tmp = leafHash;
    for (var i=0;i<levels;i++) {
        dualMux[i] = DualMux();
        dualMux[i].in[0] <== tmp;
        dualMux[i].in[1] <== proofs[i];
        dualMux[i].s <== proofsAtRight[i];

        hashers[i] = DoHash(2);
        hashers[i].in[0] <== dualMux[i].out[0];
        hashers[i].in[1] <== dualMux[i].out[1];
        
        tmp = hashers[i].hash;
    }

    root === hashers[levels-1].hash;
}

component main{public [root]} = MerkleTree(3);