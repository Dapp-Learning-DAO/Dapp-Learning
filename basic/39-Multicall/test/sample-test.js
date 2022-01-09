const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createWatcher } = require("@makerdao/multicall");


describe("Multicall contract", function() {
  it("Deployment should assign the total supply of tokens to the owner", async function() {
    const [owner] = await ethers.getSigners();
    console.log(owner.address)
    const Token = await ethers.getContractFactory("SimpleToken");

    const hardhatToken = await Token.deploy("HEHE", "HH", 1, 100000000);

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);

   // todo index-finance
  })

});

