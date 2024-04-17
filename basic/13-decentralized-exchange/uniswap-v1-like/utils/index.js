const hre = require('hardhat');
const ethers = hre.ethers;

const GAS_PRICE = 1000000000n;

const getGasFeeFromTx = async (tx) => {
  console.log(33333);
  if (tx && typeof tx.wait === 'function') {
    const { gasUsed } = await tx.wait()
    console.log(gasUsed);
    return gasUsed * GAS_PRICE
  }
  return 0n
}

module.exports = {
  GAS_PRICE,
  getGasFeeFromTx
}
