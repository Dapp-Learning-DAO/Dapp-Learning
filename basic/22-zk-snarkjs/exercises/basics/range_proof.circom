pragma circom 2.0.0;

include "../circomlib/circuits/comparators.circom";

template RangeProof() {
    signal input bounds[2];
    signal input in;
    signal output out;

    component geq = GreaterEqThan(252);
    geq.in[0] <== in;
    geq.in[1] <== bounds[0];
    geq.out === 1;

    component leq = LessEqThan(252);
    leq.in[0] <== in;
    leq.in[1] <== bounds[1];

    leq.out === 1;

    var ans = (geq.out + leq.out) / 2;
    out <== ans;
}

component main{public [bounds]} = RangeProof();