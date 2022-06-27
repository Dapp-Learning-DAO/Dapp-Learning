const { expect } = require("chai");
const { ethers } = require("hardhat");

const { constants } = ethers;

describe("identifier", function () {
  let identifier;

  before(async () => {
    TokenIdentifierExample = await ethers.getContractFactory(
      "TokenIdentifierExample"
    );

    identifier = await TokenIdentifierExample.deploy();
    await identifier.deployed();
  });

  it("test", async () => {
    // const tokenId1 =
    //   "64670030501037337596962501089550358285943868856449738089342406677160079130625";
    // const tokenId2 =
    //   "64670030501037337596962501089550358285943868856449738089342406678259590758401";

    const walletAddress = "0x8ef9F0acfEF3D9AB023812BB889A8F5a214B9B82";

    // const token1Index = await identifier.getTokenIndex(tokenId1);
    // console.log(`token1Index = ${token1Index}`);
    // const token1MaxSupply = await identifier.getMaxSupply(tokenId1);
    // console.log(`token1MaxSupply = ${token1MaxSupply}`);
    // const token2Index = await identifier.getTokenIndex(tokenId2);
    // console.log(`token2Index = ${token2Index}`);
    // const token2MaxSupply = await identifier.getMaxSupply(tokenId1);
    // console.log(`token2MaxSupply = ${token2MaxSupply}`);

    const generatedTokenId = await identifier.generateTokenId(
      walletAddress,
      "1",
      "3"
    );
    console.log(`generatedTokenId = ${generatedTokenId}`);
    // const crator = await identifier.tokenCreator(generatedTokenId);
    // console.log(`crator = ${crator}`);
    // expect(await identifier.tokenCreator(generatedTokenId)).to.equals(
    //   walletAddress
    // );
    const generatedTokenIndex = await identifier.getTokenIndex(
      generatedTokenId
    );
    console.log(`generatedTokenIndex = ${generatedTokenIndex}`);
    const generatedMaxSupply = await identifier.getMaxSupply(generatedTokenId);
    console.log(`generatedMaxSupply = ${generatedMaxSupply}`);
  });
});
