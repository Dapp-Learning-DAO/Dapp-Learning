const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("YearnVaultAdapterWithIndirection contract", function () {
  let daiToken;
  let yearnControllerMock;
  let yearnVaultMock;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy daiToken
    let daiTokenFactory = await ethers.getContractFactory("ERC20Mock");
    daiToken = await daiTokenFactory.deploy("Dai","Dai",18);
    await daiToken.deployed();

    // Deploy yearnControllerMock
    let yearnControllerMockFactory = await ethers.getContractFactory("YearnControllerMock");
    yearnControllerMock = await yearnControllerMockFactory.deploy();
    await yearnControllerMock.deployed();

    // Deploy YearnVaultMock
    let yearnVaultMockFactory = await ethers.getContractFactory("YearnVaultMock");
    yearnVaultMock = await yearnVaultMockFactory.deploy(daiToken.address,yearnControllerMock.address);
    await yearnVaultMock.deployed();

    // Deploy YearnVaultMock
    let yearnVaultAdapterWithIndirectionFactory = await ethers.getContractFactory("YearnVaultAdapterWithIndirection");
    yearnVaultAdapterWithIndirection = await yearnVaultAdapterWithIndirectionFactory.deploy(yearnVaultMock.address,godUser.address);
    await yearnVaultAdapterWithIndirection.deployed();

  });

  it("IndirectWithdraw", async function () {
    // Mint for yearnVaultAdapter
    await daiToken.mint(yearnVaultAdapterWithIndirection.address,1000);

    // Do the deposite
    await yearnVaultAdapterWithIndirection.deposit(100);

    // Check the result
    expect(await yearnVaultAdapterWithIndirection.totalValue()).to.equal(100);

    // Withdraw
    await yearnVaultAdapterWithIndirection.withdraw(user2.address,30);

    // Check the result
    expect(await daiToken.balanceOf(user2.address)).to.equal(30);
  });

});
