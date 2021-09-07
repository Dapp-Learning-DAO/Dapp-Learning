const { ethers } = require('hardhat');
const { expect } = require('chai');
const tokens = require('./tokens.json');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

function hashToken(tokenId, account) {
  return Buffer.from(ethers.utils.solidityKeccak256(['uint256', 'address'], [tokenId, account]).slice(2), 'hex')
}


describe('ERC721LazyMint', function () {
  before(async function() {
    this.accounts = await ethers.getSigners();
  });

  describe('Mint all elements', function () {
    before(async function() {
      this.registry = await deploy('ERC721LazyMint', 'Name', 'Symbol');
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);
    });

    for (const [tokenId, account] of Object.entries(tokens)) {
      it('element', async function () {
        /**
         * Account[1] (minter) creates signature
         */
        const signature = await this.accounts[1].signMessage(hashToken(tokenId, account));
        /**
         * Account[2] (anyone?) redeems token using signature
         */
        await expect(this.registry.connect(this.accounts[2]).redeem(account, tokenId, signature))
          .to.emit(this.registry, 'Transfer')
          .withArgs(ethers.constants.AddressZero, account, tokenId);
      });
    }
  });

  describe('Duplicate mint', function () {
    before(async function() {
      this.registry = await deploy('ERC721LazyMint', 'Name', 'Symbol');
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);

      this.token = {};
      [ this.token.tokenId, this.token.account ] = Object.entries(tokens).find(Boolean);
      this.token.signature = await this.accounts[1].signMessage(hashToken(this.token.tokenId, this.token.account));
    });

    it('mint once - success', async function () {
      await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.signature))
        .to.emit(this.registry, 'Transfer')
        .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
    });

    it('mint twice - failure', async function () {
      await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.signature))
        .to.be.revertedWith('ERC721: token already minted');
    });
  });

  describe('Frontrun', function () {
    before(async function() {
      this.registry = await deploy('ERC721LazyMint', 'Name', 'Symbol');
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);

      this.token = {};
      [ this.token.tokenId, this.token.account ] = Object.entries(tokens).find(Boolean);
      this.token.signature = await this.accounts[1].signMessage(hashToken(this.token.tokenId, this.token.account));
    });

    it('Change owner - fail', async function () {
      await expect(this.registry.redeem(this.accounts[0].address, this.token.tokenId, this.token.signature))
        .to.be.revertedWith('Invalid signature');
    });
  });
});
