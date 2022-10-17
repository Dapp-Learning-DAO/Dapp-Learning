pragma circom 2.0.0;

//prove that 3x^3 + 2x^2 + x = 6
template PolyNomial(){
    signal input in;
    
    signal output out;

    signal tmp <== in*in;
    signal tmp2 <== 3*tmp*in;

    out <== tmp2 + 2*tmp + in;
}

component main = PolyNomial();