const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { readConfig } = require("../scripts/config");

const { constants } = ethers;
const config = readConfig();

describe("deploy collection test", function () {
  let wyvernProxyRegistryInstance;
  let wyvernExchangeWithBulkCancellationsInstance;
  let collectionInstance;

  const networkName = network.name;

  before(async () => {
    const WyvernProxyRegistry = await ethers.getContractFactory(
      "WyvernProxyRegistry"
    );
    const WyvernExchangeWithBulkCancellations = await ethers.getContractFactory(
      "WyvernExchangeWithBulkCancellations"
    );

    const AssetContractShared = await ethers.getContractFactory(
      "AssetContractShared"
    );

    const address = config.deployed[networkName]["WyvernProxyRegistry"];
    wyvernProxyRegistryInstance = await WyvernProxyRegistry.attach(address);

    const exchangeAddress =
      config.deployed[networkName]["WyvernExchangeWithBulkCancellations"];
    wyvernExchangeWithBulkCancellationsInstance =
      await WyvernExchangeWithBulkCancellations.attach(exchangeAddress);

    collectionInstance = await AssetContractShared.attach(
      config.deployed[networkName]["AssetContractShared"]
    );
  });

  it("proxy should have grantInitialAuthentication correctly", async function () {
    const initialAddressSet =
      await wyvernProxyRegistryInstance.initialAddressSet();
    expect(initialAddressSet).to.equals(true);
    const exchangeAddress =
      config.deployed[networkName]["WyvernExchangeWithBulkCancellations"];
    expect(
      await wyvernProxyRegistryInstance.contracts(exchangeAddress)
    ).to.equals(true);
    expect(
      await wyvernProxyRegistryInstance.contracts(
        "0x35D4A3Bd19382e5180824823E90312Be405c3707"
      )
    ).to.equals(false);
  });

  it("should set proxyRegistryAddress correctly", async () => {
    const proxyRegistryAddress =
      await collectionInstance.proxyRegistryAddress();
    expect(proxyRegistryAddress.toUpperCase()).to.equals(
      config.deployed[networkName]["WyvernProxyRegistry"].toUpperCase()
    );

    if (networkName === "rinkeby") {
      const proxyAddress = "0X54AEA186AFC5CBA0330B23DF4EF6047B4852BB12";
      const walletAddress = "0x8ef9F0acfEF3D9AB023812BB889A8F5a214B9B82";
      expect(
        (await wyvernProxyRegistryInstance.proxies(walletAddress)).toUpperCase()
      ).equals(proxyAddress.toUpperCase());
    } else {
      const proxyAddress = "0x1e0a21ee261dbead4f455896bfb8327ba492ab33";
      const walletAddress = "0x8ef9F0acfEF3D9AB023812BB889A8F5a214B9B82";
      expect(
        (await wyvernProxyRegistryInstance.proxies(walletAddress)).toUpperCase()
      ).equals(proxyAddress.toUpperCase());
    }
  });

  it("get token id uri", async () => {
    if (networkName === "rinkeby") {
      const tokenId =
        "64670030501037337596962501089550358285943868856449738089342406678259590758401";
      const uri = await collectionInstance.uri(tokenId);
      console.log(uri);
    }
  });

  it("should balance eq 1", async () => {
    if (networkName === "rinkeby") {
      let walletAddress = "0x8ef9F0acfEF3D9AB023812BB889A8F5a214B9B82";
      const tokenId =
        "64670030501037337596962501089550358285943868856449738089342406677160079130625";
      const balance = await collectionInstance.balanceOf(
        walletAddress,
        tokenId
      );
      console.log(`balance = ${balance}`);
      expect(balance).to.equals(1);
    } else {
      let walletAddress = "0x35D4A3Bd19382e5180824823E90312Be405c3707";
      const tokenId =
        "64670030501037337596962501089550358285943868856449738089342406678259590758401";
      const crator = await collectionInstance.creator(tokenId);
      console.log(`crator= ${crator}`);
      // expect(walletAddress).to.equals(crator);

      const balance = await collectionInstance.balanceOf(
        walletAddress,
        tokenId
      );
      expect(balance).to.equals(1);
    }
  });

  it("should have add shared proxy", async () => {
    if (networkName === "rinkeby") {
      const tokenId =
        "64670030501037337596962501089550358285943868856449738089342406677160079130625";
      const walletAddress = "0x8ef9F0acfEF3D9AB023812BB889A8F5a214B9B82";
      const creator = await collectionInstance.creator(tokenId);
      expect(creator).equals(walletAddress);
    }
  });
});
