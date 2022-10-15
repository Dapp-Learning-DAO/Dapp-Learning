pragma circom 2.0.0;


template PolyVerifier(a, b) {
    signal input x;
    signal output out;
    out <== a*x*x + b*x ;
}

component main = PolyVerifier(1, 2);