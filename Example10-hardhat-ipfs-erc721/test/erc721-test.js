require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );

const getBalance = ethers.provider.getBalance;


describe("ERC721 contract", function() {
  let owner, user1, user2
  let myerc721

  beforeEach(async function() {
    ;[owner, user1, user2] = await ethers.getSigners();

    console.log('owner.address', owner.address)
    console.log('user1.address', user1.address)

    const contractfactory = await ethers.getContractFactory("MYERC721");
    myerc721 = await contractfactory.deploy("MYERC721","TEST","");

    console.log('myerc721.address', myerc721.address);
  })

  it("Deployment should not assign any Token to deployer", async function() {
    
    expect(await myerc721.balanceOf(owner.address)).to.equal("0");
  });

});
