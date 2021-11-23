const MerkleTree = require('./merkle-tree')
const { BigNumber, utils } = require('ethers')

let tree;
export default class BalanceTree {

  constructor(balances) {
    this.tree = new MerkleTree(
      balances.map(({ account, amount }, index) => {
        return BalanceTree.toNode(index, account, amount)
      })
    )
  }

  verifyProof(
    index,
    account,
    amount,
    proof,
    root
  ) {
    let pair = BalanceTree.toNode(index, account, amount)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  // keccak256(abi.encode(index, account, amount))
  toNode(index, account, amount) {
    return Buffer.from(
      utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amount]).substr(2),
      'hex'
    )
  }

  getHexRoot() {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  getProof(index, account, amount) {
    return this.tree.getHexProof(BalanceTree.toNode(index, account, amount))
  }

}
