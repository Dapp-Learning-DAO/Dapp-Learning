const hre = require("hardhat");
const { getAddrs } = require('../utils/index');

async function main() {
  const UniswapFlashloaner = await ethers.getContractFactory("UniswapFlashloaner");

  const uniFlashloaner = await UniswapFlashloaner.deploy(...getAddrs());

  console.log("contract deployed to:", uniFlashloaner.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

