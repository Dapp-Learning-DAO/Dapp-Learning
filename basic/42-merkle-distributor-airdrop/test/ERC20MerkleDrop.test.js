const { ethers } = require('hardhat');
const  MerkleTree  = require('./merkle-tree.js');
const  balanceTree   = require('./balance-tree.js');
const keccak256 = require('keccak256');
const { expect } = require('chai');
//const tokens = require('./tokens.json');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

function hashToken(index, account, amount) {
  return Buffer.from(ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amount]).slice(2), 'hex')
}


describe('ERC20MerkleDrop', function () {

  let treeRoot;
  let erc20;
   let owner;
   let alice;
   let bob;
   let merkleTree;
   let  tree;


  
  // merkleTree = new MerkleTree(Object.entries(tokens).map(token => hashToken(...token)), keccak256, { sortPairs: true });
  console.log("-------1")
 console.log(balanceTree);
  describe('Mint all elements', function () {
    before(async function() {
      [owner,alice, bob] = await ethers.getSigners();
       erc20 = await deploy('TestERC20', "AAA token",'AAA', 100000000 );
      
      // tree = BalanceTree.default.balanceTree();
       tree =  BalanceTree.balanceTree([
        { account: alice.address, amount: ethers.BigNumber.from(100) },
        { account: bob.address, amount: ethers.BigNumber.from(101) },
      ])
      console.log("-------2")
      this.merkleDistributor = await deploy("MerkleDistributor", erc20.address, tree.getHexRoot());
    });

    // for (const [tokenId, account] of Object.entries(tokens)) {
    //   it('element', async function () {
    //     /**
    //      * Create merkle proof (anyone with knowledge of the merkle tree)
    //      */
    //     const proof = this.merkleTree.getHexProof(hashToken(tokenId, account));
    //     /**
    //      * Redeems token using merkle proof (anyone with the proof)
    //      */
    //     await expect(this.registry.redeem(account, tokenId, proof))
    //       .to.emit(this.registry, 'Transfer')
    //       .withArgs(ethers.constants.AddressZero, account, tokenId);
    //   });
    // }

    it('successful claim', async () => {
      const proof0 = tree.getProof(0, alice.address, BigNumber.from(100))
      await expect(distributor.claim(0, alice.address, 100, proof0))
        .to.emit(distributor, 'Claimed')
        .withArgs(0, alice.address, 100)
      const proof1 = tree.getProof(1, bob.address, BigNumber.from(101))
      await expect(distributor.claim(1, wallet1.address, 101, proof1))
        .to.emit(distributor, 'Claimed')
        .withArgs(1, bob.address, 101)
    })

  });

  // describe('Duplicate mint', function () {
  //   before(async function() {
  //     this.registry = await deploy('ERC721MerkleDrop', 'Name', 'Symbol', this.merkleTree.getHexRoot());

  //     this.token = {};
  //     [ this.token.tokenId, this.token.account ] = Object.entries(tokens).find(Boolean);
  //     this.token.proof = this.merkleTree.getHexProof(hashToken(this.token.tokenId, this.token.account));
  //   });

  //   it('mint once - success', async function () {
  //     await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.proof))
  //       .to.emit(this.registry, 'Transfer')
  //       .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
  //   });

  //   it('mint twice - failure', async function () {
  //     await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.proof))
  //       .to.be.revertedWith('ERC721: token already minted');
  //   });
  // });

  // describe('Frontrun', function () {
  //   before(async function() {
  //     this.registry = await deploy('ERC721MerkleDrop', 'Name', 'Symbol', this.merkleTree.getHexRoot());

  //     this.token = {};
  //     [ this.token.tokenId, this.token.account ] = Object.entries(tokens).find(Boolean);
  //     this.token.proof = this.merkleTree.getHexProof(hashToken(this.token.tokenId, this.token.account));
  //   });

  //   it('prevented', async function () {
  //     await expect(this.registry.redeem(this.accounts[0].address, this.token.tokenId, this.token.proof))
  //       .to.be.revertedWith('Invalid merkle proof');
  //   });
  // });
});
