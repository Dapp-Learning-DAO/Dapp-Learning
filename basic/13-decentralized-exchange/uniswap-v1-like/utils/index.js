const { ethers } = require("ethers");
const { BigNumber } = ethers;

const GAS_PRICE = BigNumber.from("1000000000");

const getGasFeeFromTx = async (tx) => {
  if (tx && typeof tx.wait === 'function') {
    const { gasUsed } = await tx.wait()
    return gasUsed.mul(GAS_PRICE)
  }
  return BigNumber.from(0)
}

module.exports = {
  GAS_PRICE,
  getGasFeeFromTx
}