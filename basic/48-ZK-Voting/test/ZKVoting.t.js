const { expect } = require("chai");
const hre = require("hardhat");
const { loadAdd2TreeProof, loadProveInTreeProof } = require("../utils/calcProof.js");
const add2TreeInputs00 = require("../circuits/add2Tree/input_00.json");
const add2TreeInputs01 = require("../circuits/add2Tree/input_01.json");
const proveInTreeInputs00 = require("../circuits/proveInTree/input_00.json");
const proveInTreeInputs01 = require("../circuits/proveInTree/input_01.json");

const ONE_DAY = 24 * 60 * 60;

describe("Root", function () {
  async function deployZKVotingFixture() {
    const ZKVoting = await hre.ethers.getContractFactory("ZKVoting");
    const zkvoting = await ZKVoting.deploy(0);
    return {
      zkvoting,
    };
  }

  it("Should set root", async function () {
    const { zkvoting } = await deployZKVotingFixture();
    expect(await zkvoting.root()).to.equal(0);
  });

  it("addLeaf & proveAndVote", async function () {
    const [user0] = await hre.ethers.getSigners();
    const { zkvoting } = await deployZKVotingFixture();

    // leaf is empty


    // add 1st leaf
    const add2TreeCalldata00 = await loadAdd2TreeProof(add2TreeInputs00);
    await zkvoting.connect(user0).addLeaf(...add2TreeCalldata00);
    expect(await zkvoting.leafValues(0), add2TreeCalldata00[3][3]);

    // add 2nd leaf
    const add2TreeCalldata01 = await loadAdd2TreeProof(add2TreeInputs01);
    await zkvoting.connect(user0).addLeaf(...add2TreeCalldata01);
    expect(await zkvoting.leafValues(1), add2TreeCalldata01[3][3]);

    const { timestamp } = await hre.ethers.provider.getBlock();

    await zkvoting.createVote(timestamp + 10 * ONE_DAY);
    await zkvoting.createVote(timestamp + 10 * ONE_DAY);

    expect(await zkvoting.voteNonce(), 2);

    // prove 1st leaf
    const proveInTreeCalldata00 = await loadProveInTreeProof(proveInTreeInputs00);
    await zkvoting.connect(user0).proveAndVote(...proveInTreeCalldata00, true);
    // vote count +1
    expect(await zkvoting.voteResult(1), 1);

    // prove 2nd leaf
    const proveInTreeCalldata01 = await loadProveInTreeProof(proveInTreeInputs01);
    await zkvoting.connect(user0).proveAndVote(...proveInTreeCalldata01, true);
    // vote count +1
    expect(await zkvoting.voteResult(1), 2);

  });
});
