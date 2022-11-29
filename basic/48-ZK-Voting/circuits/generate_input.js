const fs = require("fs");
const { buildSMT, SMTMemDb, buildPoseidonOpt } = require("circomlibjs");

let poseidon;
async function buildTree(treeData) {
  const db = new SMTMemDb(poseidon.F);

  let s = await buildSMT(db, 0);
  for (let i = 0; i < treeData.length; i++) {
    const { key, value } = treeData[i];
    await s.insert(key, value);
  }
  return s;
}

async function insertLeaf(smtTree, newKey, newValue) {
  const insertRes = await smtTree.insert(newKey, newValue);

  return {
    oldRoot: insertRes.oldRoot == 0 ? "0" : u8arr2str(insertRes.oldRoot),
    newKey: newKey + '',
    newValue: newValue + '',
    oldKey: u8arr2str(insertRes.oldKey),
    oldValue: u8arr2str(insertRes.oldValue),
    siblings: formatSliblings(insertRes.siblings, 3),
  };
}

async function proveInTree(smtTree, key) {
  const findRes = await smtTree.find(key);

  return {
    root: u8arr2str(smtTree.root),
    voteId: "1",
    key: key + "",
    secret: "1",
    nullifier: "1",
    siblings: formatSliblings(findRes.siblings, 4),
  };
}

async function processAdd2Tree() {
  const smtTree = await buildTree([]);
  const value = await poseidon([1, 1]);

  const add2TreeRes0 = await insertLeaf(smtTree, 0, u8arr2str(value));
  console.log("add2TreeRes0", add2TreeRes0);
  fs.writeFileSync("./add2Tree/input_00.json", JSON.stringify(add2TreeRes0));

  const add2TreeRes1 = await insertLeaf(smtTree, 1, u8arr2str(value));
  console.log("add2TreeRes1", add2TreeRes1);
  fs.writeFileSync("./add2Tree/input_01.json", JSON.stringify(add2TreeRes1));
}

async function processProveInTree() {
  // secret: 1, nullifier: 1
  const value = await poseidon([1, 1]);
  const smtTree = await buildTree([
    { key: 0, value },
    { key: 1, value },
  ]);

  const proveInTree0 = await proveInTree(smtTree, 0);
  console.log("proveInTree0", proveInTree0);
  fs.writeFileSync("./proveInTree/input_00.json", JSON.stringify(proveInTree0));

  const proveInTree1 = await proveInTree(smtTree, 1);
  console.log("proveInTree1", proveInTree1);
  fs.writeFileSync("./proveInTree/input_01.json", JSON.stringify(proveInTree1));
}

async function main() {
  poseidon = await buildPoseidonOpt();

  await processAdd2Tree();
  await processProveInTree();
}

function u8arr2str(u8arr) {
  return poseidon.F.toString(u8arr);
}

// smt tree's level is 3,
// if siblings.length < 3, should to add 0
// add2Tree.circom ... component main = Add2Tree(3);
function formatSliblings(siblings, len) {
  const arr = [];
  for (let i = 0; i < len; i++) {
    if (i < siblings.length && siblings[i] != 0) {
      arr.push(u8arr2str(siblings[i]));
    } else {
      arr.push("0");
    }
  }

  return arr;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
