const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("AlToken contract", function () {
  let alToken;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy AlToken
    let alTokenFactory = await ethers.getContractFactory("AlToken");
    alToken = await alTokenFactory.deploy();
    await alToken.deployed();

    // Set goduser into the WhiteList
    await alToken.setWhitelist(godUser.address,true);
  });

  it("Set whiteList for other users", async function () {
    // Set WhiteList for user2
    await alToken.setWhitelist(user2.address, true);

    expect(await alToken.whiteList(user2.address)).to.be.true;
  });

  it("Set blacklist for other users", async function () {
    // Set WhiteList for user2
    await alToken.setBlacklist(user2.address);

    expect(await alToken.blacklist(user2.address)).to.be.true;
  });

  it("Paused Alchemist", async function () {
    // Set WhiteList for user2
    await alToken.pauseAlchemist(user2.address,true);

    // Check the result
    expect(await alToken.paused(user2.address)).to.be.true;
  }); 

  it("Set Ceiling", async function () {
    // Set Ceiling for user2
    await alToken.setCeiling(godUser.address,100);

    // Check the ceiling
    expect(await alToken.ceiling(godUser.address)).to.equal(100);
  }); 

  it("lower HasMinted", async function () {
    // Set Ceiling for user2
    await alToken.setCeiling(godUser.address,100);

    // Mint for User2
    await alToken.mint(godUser.address,100);

    // Check the hasMinted amount
    expect(await alToken.hasMinted(godUser.address)).to.equal(100);

    // lower lowerHasMinted
    await alToken.lowerHasMinted(100);

    // Check the hasMinted amount
    expect(await alToken.hasMinted(godUser.address)).to.equal(0);
  }); 

  
});
