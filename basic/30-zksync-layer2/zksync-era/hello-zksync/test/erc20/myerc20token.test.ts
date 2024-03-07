import { expect } from 'chai';
import { Contract, Wallet } from "zksync-ethers";
import { getWallet, deployContract, LOCAL_RICH_WALLETS } from '../../deploy/utils';
import * as ethers from "ethers";

describe("MyERC20Token", function () {
  let tokenContract: Contract;
  let ownerWallet: Wallet;
  let userWallet: Wallet;

  before(async function () {
    ownerWallet = getWallet(LOCAL_RICH_WALLETS[0].privateKey);
    userWallet = getWallet(LOCAL_RICH_WALLETS[1].privateKey);

    tokenContract = await deployContract("MyERC20Token", [], { wallet: ownerWallet, silent: true });
  });

  it("Should have correct initial supply", async function () {
    const initialSupply = await tokenContract.totalSupply();
    expect(initialSupply.toString()).to.equal("1000000000000000000000000"); // 1 million tokens with 18 decimals
  });

  it("Should allow owner to burn tokens", async function () {
    const burnAmount = ethers.utils.parseEther("10"); // Burn 10 tokens
    await tokenContract.burn(burnAmount);
    const afterBurnSupply = await tokenContract.totalSupply();
    expect(afterBurnSupply.toString()).to.equal("999990000000000000000000"); // 999,990 tokens remaining
  });

  it("Should allow user to transfer tokens", async function () {
    const transferAmount = ethers.utils.parseEther("50"); // Transfer 50 tokens
    await tokenContract.transfer(userWallet.address, transferAmount);
    const userBalance = await tokenContract.balanceOf(userWallet.address);
    expect(userBalance.toString()).to.equal(transferAmount.toString());
  });

  it("Should fail when user tries to burn more tokens than they have", async function () {
    const userTokenContract = new Contract(tokenContract.address, tokenContract.interface, userWallet);
    const burnAmount = ethers.utils.parseEther("100"); // Try to burn 100 tokens
    try {
      await userTokenContract.burn(burnAmount);
      expect.fail("Expected burn to revert, but it didn't");
    } catch (error) {
      expect(error.message).to.include("burn amount exceeds balance");
    }
  });
});

