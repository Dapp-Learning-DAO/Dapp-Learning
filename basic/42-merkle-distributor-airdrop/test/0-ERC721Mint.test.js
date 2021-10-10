const { ethers } = require('hardhat');
const { expect } = require('chai');
const tokens = require('./tokens.json');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}


describe('ERC721Basic', function () {
  before(async function() {
    this.accounts = await ethers.getSigners();
  });

  describe('Mint all elements', function () {
    before(async function() {
      this.registry = await deploy('ERC721Basic', 'Name', 'Symbol');
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);
    });

    for (const [tokenId, account] of Object.entries(tokens)) {
      it('element', async function () {

        await expect(this.registry.connect(this.accounts[1]).mint(account, tokenId))
          .to.emit(this.registry, 'Transfer')
          .withArgs(ethers.constants.AddressZero, account, tokenId);
      });
    } 
  });
});
