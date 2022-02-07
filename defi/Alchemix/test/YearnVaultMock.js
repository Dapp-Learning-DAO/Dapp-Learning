const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("YearnVaultMock contract", function () {
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

  });

  it("Vdecimals", async function () {
    // Set WhiteList for user2
    expect(await yearnVaultMock.vdecimals()).to.equal(18);
  });

  it("Deposit", async function () {
    // Mint for godUser
    await daiToken.mint(godUser.address,1000);

    // Arpprove yearnVaultMock to do the transnfer
    await daiToken.approve(yearnVaultMock.address,1000);

    // Deposite to yearnVaultMock
    await yearnVaultMock.deposit(100);

    // Set WhiteList for user2
    expect(await yearnVaultMock.balance()).to.equal(100);
  }); 

  it("Earn", async function () {
    // Mint for yearnVaultMock
    await daiToken.mint(yearnVaultMock.address,1000);

    // Do the earn
    await yearnVaultMock.earn();

    // Set WhiteList for user2
    expect(await daiToken.balanceOf(yearnControllerMock.address)).to.equal(950);
  }); 

  it("Withdraw", async function () {
    // Mint for godUser
    await daiToken.mint(godUser.address,100);

    // Mint for user2
    await daiToken.mint(user2.address,100);

    // Arpprove yearnVaultMock to do the transnfer
    await daiToken.approve(yearnVaultMock.address,1000);

    let daiTokenUser2 = daiToken.connect(user2);

    // Arpprove yearnVaultMock to do the transnfer
    await daiTokenUser2.approve(yearnVaultMock.address,1000);

    // Deposite to yearnVaultMock
    await yearnVaultMock.deposit(100);

    // User2 yarnValutMock
    let yearnVaultMockUser2 = yearnVaultMock.connect(user2);

    // Deposite to yearnVaultMock
    await yearnVaultMockUser2.deposit(100);

    // Set WhiteList for user2
    expect(await yearnVaultMock.balanceOf(user2.address)).to.equal(100);

    // WithDraw
    await yearnVaultMock.withdraw(20,user2.address);

    // Check result
    expect(await daiToken.balanceOf(user2.address)).to.equal(20);
    expect(await daiToken.balanceOf(yearnVaultMock.address)).to.equal(180);
  }); 

  it("Clear", async function () {
    // Mint for godUser
    await daiToken.mint(godUser.address,100);

    // Mint for user2
    await daiToken.mint(user2.address,100);

    // Arpprove yearnVaultMock to do the transnfer
    await daiToken.approve(yearnVaultMock.address,1000);

    let daiTokenUser2 = daiToken.connect(user2);

    // Arpprove yearnVaultMock to do the transnfer
    await daiTokenUser2.approve(yearnVaultMock.address,1000);

    // Deposite to yearnVaultMock
    await yearnVaultMock.deposit(100);

    // User2 yarnValutMock
    let yearnVaultMockUser2 = yearnVaultMock.connect(user2);

    // Deposite to yearnVaultMock
    await yearnVaultMockUser2.deposit(100);

    // Set WhiteList for user2
    expect(await yearnVaultMock.balanceOf(user2.address)).to.equal(100);

    // Clear
    await yearnVaultMock.clear();

    // Check result
    expect(await daiToken.balanceOf(yearnControllerMock.address)).to.equal(200);
  });

  
});
