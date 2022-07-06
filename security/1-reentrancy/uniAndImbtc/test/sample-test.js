const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const [platform, user] = await ethers.getSigners();
    const Game = await ethers.getContractFactory("Game");
    const game = await Game.deploy(platform.address);
    await game.deployed();


    let receipt = await (await game.connect(user).bid({value: 1000})).wait()
    console.log(receipt.gasUsed.toNumber())
  });
});
