// require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { BigNumber,keccak256,toUtf8Bytes } = ethers;
// const { keccak256, toUtf8Bytes } = utils;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("MYERC721 contract", function () {
  let deployer, other;
  let token;

  const name = "MYERC721";
  const symbol = "MAIT";
  const baseURI = "my.app/";

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MINTER_ROLE = keccak256(toUtf8Bytes("MINTER_ROLE"));

  beforeEach(async function () {
    [deployer, other] = await ethers.getSigners();

    const MYERC721_MOCK = await ethers.getContractFactory("MYERC721");
    token = await MYERC721_MOCK.deploy(name, symbol, baseURI);
    await token.waitForDeployment();
  });

  it("token has correct name", async function () {
    expect(await token.name()).to.equal(name);
  });

  it("token has correct symbol", async function () {
    expect(await token.symbol()).to.equal(symbol);
  });

  it("deployer has the default admin role", async function () {
    expect(await token.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.equal("1");
    expect(await token.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(
      deployer.address
    );
  });

  it("deployer has the minter role", async function () {
    expect(await token.getRoleMemberCount(MINTER_ROLE)).to.be.equal("1");
    expect(await token.getRoleMember(MINTER_ROLE, 0)).to.equal(
      deployer.address
    );
  });

  it("minter role admin is the default admin", async function () {
    expect(await token.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
  });

  describe("minting", function () {
    it("deployer can mint tokens", async function () {
      const tokenId = BigInt("0");

      expect(await token.balanceOf(other.address)).to.be.equal("0");

      await expect(token.mint(other.address, { from: deployer.address }))
        .to.emit(token, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      expect(await token.balanceOf(other.address)).to.be.equal("1");
      expect(await token.ownerOf(tokenId)).to.equal(other.address);

      expect(await token.tokenURI(tokenId)).to.equal(baseURI + tokenId);
    });

    it("other accounts cannot mint tokens", async function () {
      await expect(token.connect(other).mint(other.address)).to.be.revertedWith(
        "ERC721PresetMinterPauserAutoId: must have minter role to mint"
      );
    });
  });

  describe("pausing", function () {
    it("deployer can pause", async function () {
      await expect(token.pause())
        .to.emit(token, "Paused")
        .withArgs(deployer.address);

      expect(await token.paused()).to.equal(true);
    });

    it("deployer can unpause", async function () {
      await token.pause();
      await expect(token.unpause())
        .to.emit(token, "Unpaused")
        .withArgs(deployer.address);

      expect(await token.paused()).to.equal(false);
    });

    it("cannot mint while paused", async function () {
      await token.pause();

      await expect(
        token.connect(deployer).mint(other.address)
      ).to.be.revertedWith("ERC721Pausable: token transfer while paused");
    });

    it("other accounts cannot pause", async function () {
      await expect(token.connect(other).pause()).to.be.revertedWith(
        "ERC721PresetMinterPauserAutoId: must have pauser role to pause"
      );
    });

    it("other accounts cannot unpause", async function () {
      await token.pause();

      await expect(token.connect(other).unpause()).to.be.revertedWith(
        "ERC721PresetMinterPauserAutoId: must have pauser role to unpause"
      );
    });
  });

  describe("burning", function () {
    it("holders can burn their tokens", async function () {
      const tokenId = BigInt("0");

      await token.mint(other.address);

      await expect(token.connect(other).burn(tokenId))
        .to.emit(token, "Transfer")
        .withArgs(other.address, ZERO_ADDRESS, tokenId);

      expect(await token.balanceOf(other.address)).to.be.equal("0");
      expect(await token.totalSupply()).to.be.equal("0");
    });
  });
});
