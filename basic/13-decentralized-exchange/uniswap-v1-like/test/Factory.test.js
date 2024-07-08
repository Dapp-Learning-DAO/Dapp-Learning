const { expect } = require("chai");
const hre = require('hardhat');
const ethers = hre.ethers;
const toWei = (value) => ethers.parseEther(value.toString());

describe("Factory", () => {
  let owner;
  let factory;
  let token;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Token", "TKN", toWei(1000000));
    await token.waitForDeployment();

    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  it("is deployed", async () => {
    expect(factory.target).to.not.equal("");
  });

  describe("createExchange", () => {
    it("deploys an exchange", async () => {
      const exchangeAddress = await factory.createExchange.staticCall(token.target);
      await factory.createExchange(token.target);

      expect(await factory.getExchange(token.target)).to.equal(
        exchangeAddress
      );

      const Exchange = await ethers.getContractFactory("Exchange");
      const exchange = await Exchange.attach(exchangeAddress);
      expect(await exchange.name()).to.equal("Uniswap-V1-like");
      expect(await exchange.symbol()).to.equal("UNI-V1");
      expect(await exchange.factoryAddress()).to.equal(factory.target);
    });

    it("doesn't allow zero address", async () => {
      await expect(
        factory.createExchange("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("invalid token address");
    });

    it("fails when exchange exists", async () => {
      await factory.createExchange(token.target);

      await expect(factory.createExchange(token.target)).to.be.revertedWith(
        "exchange already exists"
      );
    });
  });

  describe("getExchange", () => {
    it("returns exchange address by token address", async () => {
      const exchangeAddress = await factory.createExchange.staticCall(token.target);
      await factory.createExchange(token.target);

      expect(await factory.getExchange(token.target)).to.equal(
        exchangeAddress
      );
    });
  });
});
