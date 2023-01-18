pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/smt/smtprocessor.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

template Add2Tree(nLevels) {
  signal input oldRoot; // should be defined in contract
  signal input newKey;  // should be defined in contract
  signal input newValue;
  signal input oldKey;
  signal input oldValue;
  signal input siblings[nLevels];

  signal output outRoot;

  component rootIsZero = IsZero();
  rootIsZero.in <== oldRoot;

  component tree = SMTProcessor(nLevels);
  tree.oldRoot <== oldRoot;
  for (var i=0; i<nLevels; i++) tree.siblings[i] <== siblings[i];
  tree.oldKey <== oldKey;
  tree.oldValue <== oldValue;
  tree.isOld0 <== rootIsZero.out;
  tree.newKey <== newKey;
  tree.newValue <== newValue;
  tree.fnc[0] <== 1;
  tree.fnc[1] <== 0;

  outRoot <== tree.newRoot;
}

component main {public [oldRoot, newKey, newValue, oldKey, oldValue]} = Add2Tree(3);