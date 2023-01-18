const snarkjs = require("snarkjs");
function parseSolidityCalldata(prf, sgn) {
  let calldata = [
    [prf.pi_a[0], prf.pi_a[1]],
    [
      [prf.pi_b[0][1], prf.pi_b[0][0]],
      [prf.pi_b[1][1], prf.pi_b[1][0]],
    ],
    [prf.pi_c[0], prf.pi_c[1]],
    [...sgn],
  ];

  return calldata;
}

async function loadAdd2TreeProof(inputs) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    "./circuits/add2Tree/add2Tree_js/add2Tree.wasm",
    "./circuits/add2Tree/add2Tree_0001.zkey"
  );
  const calldata = parseSolidityCalldata(proof, publicSignals);
  return calldata;
}

async function loadProveInTreeProof(inputs) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    "./circuits/proveInTree/proveInTree_js/proveInTree.wasm",
    "./circuits/proveInTree/proveInTree_0001.zkey"
  );
  const calldata = parseSolidityCalldata(proof, publicSignals);
  return calldata;
}

module.exports = {
  parseSolidityCalldata,
  loadAdd2TreeProof,
  loadProveInTreeProof,
};
