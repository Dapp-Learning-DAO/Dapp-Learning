const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("AlEth contract", function () {
  let alEthToken;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy AlEth
    let alEthFactory = await ethers.getContractFactory("AlEth");
    alEth = await alEthFactory.deploy();
    await alEth.deployed();

    // Set goduser into the WhiteList
    await alEth.setWhitelist(godUser.address,true);
  });

  it("Set whiteList for other users", async function () {
    // Set WhiteList for user2
    await alEth.setWhitelist(user2.address, true);

    expect(await alEth.whiteList(user2.address)).to.be.true;
  });

  it("Paused Alchemist", async function () {
    // Set WhiteList for user2
    await alEth.pauseAlchemist(user2.address,true);

    // Check the result
    expect(await alEth.paused(user2.address)).to.be.true;
  }); 

  it("Set Ceiling", async function () {
    // Set Ceiling for user2
    await alEth.setCeiling(godUser.address,100);

    // Check the ceiling
    expect(await alEth.ceiling(godUser.address)).to.equal(100);
  }); 

  it("lower HasMinted", async function () {
    // Set Ceiling for user2
    await alEth.setCeiling(godUser.address,100);

    // Mint for User2
    await alEth.mint(godUser.address,100);

    // Check the hasMinted amount
    expect(await alEth.hasMinted(godUser.address)).to.equal(100);

    // lower lowerHasMinted
    await alEth.lowerHasMinted(100);

    // Check the hasMinted amount
    expect(await alEth.hasMinted(godUser.address)).to.equal(0);
  }); 

  
});
