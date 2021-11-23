const { ethers } = require('hardhat');
const  MerkleTree  = require('./merkle-tree.js');
const  BalanceTree   = require('./balance-tree.js');
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
   let  tree;
   let distributor;


  
  // merkleTree = new MerkleTree(Object.entries(tokens).map(token => hashToken(...token)), keccak256, { sortPairs: true });
  console.log("-------1")
 console.log(BalanceTree);
  describe('Mint all elements', function () {
    before(async function() {
      [owner,alice, bob] = await ethers.getSigners();
       erc20 = await deploy('TestERC20', "AAA token",'AAA', 100000000 );
       tree =  new BalanceTree([
        { account: alice.address, amount: ethers.BigNumber.from(100) },
        { account: bob.address, amount: ethers.BigNumber.from(101) },
      ])
     
      distributor = await deploy("MerkleDistributor", erc20.address, tree.getHexRoot());

      await erc20.transfer(distributor.address, 201);

    });

    it('successful claim', async () => {
      const proof0 = tree.getProof(0, alice.address, ethers.BigNumber.from(100))
      await expect(distributor.claim(0, alice.address, 100, proof0))
        .to.emit(distributor, 'Claimed')
        .withArgs(0, alice.address, 100)
      const proof1 = tree.getProof(1, bob.address, ethers.BigNumber.from(101))
      await expect(distributor.claim(1, bob.address, 101, proof1))
        .to.emit(distributor, 'Claimed')
        .withArgs(1, bob.address, 101)
    })

  });

  

});
