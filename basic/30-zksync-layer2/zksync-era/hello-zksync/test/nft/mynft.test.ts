import { expect } from 'chai';
import { Contract, Wallet } from "zksync-ethers";
import { getWallet, deployContract, LOCAL_RICH_WALLETS } from '../../deploy/utils';

describe("MyNFT", function () {
  let nftContract: Contract;
  let ownerWallet: Wallet;
  let recipientWallet: Wallet;

  before(async function () {
    ownerWallet = getWallet(LOCAL_RICH_WALLETS[0].privateKey);
    recipientWallet = getWallet(LOCAL_RICH_WALLETS[1].privateKey);

    nftContract = await deployContract(
      "MyNFT",
      ["MyNFTName", "MNFT", "https://mybaseuri.com/token/"],
      { wallet: ownerWallet, silent: true }
    );
  });

  it("Should mint a new NFT to the recipient", async function () {
    await nftContract.connect(ownerWallet).mint(recipientWallet.address);
    const balance = await nftContract.balanceOf(recipientWallet.address);
    expect(balance.toNumber()).to.equal(1);
  });

  it("Should have correct token URI after minting", async function () {
    const tokenId = 1; // Assuming the first token minted has ID 1
    const tokenURI = await nftContract.tokenURI(tokenId);
    expect(tokenURI).to.equal("https://mybaseuri.com/token/1");
  });

  it("Should allow owner to mint multiple NFTs", async function () {
    await nftContract.connect(ownerWallet).mint(recipientWallet.address);
    await nftContract.connect(ownerWallet).mint(recipientWallet.address);
    const balance = await nftContract.balanceOf(recipientWallet.address);
    expect(balance.toNumber()).to.equal(3); // 1 initial nft + 2 minted
  });

  it("Should not allow non-owner to mint NFTs", async function () {
    try {
      await nftContract.connect(recipientWallet).mint(recipientWallet.address);
      expect.fail("Expected mint to revert, but it didn't");
    } catch (error) {
      expect(error.message).to.include("Ownable: caller is not the owner");
    }
  });
});
