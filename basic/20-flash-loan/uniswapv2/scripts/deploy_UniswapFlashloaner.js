const hre = require("hardhat");
const { getAddrs } = require('../utils/index');
const fs = require("fs");

async function main() {
  const UniswapFlashloanerFactory = await ethers.getContractFactory("UniswapFlashloaner");
  const uniFlashloaner = await UniswapFlashloanerFactory.deploy(...getAddrs());
  console.log("UniswapFlashloaner contract deployed to:", uniFlashloaner.address);

  const uniswapV2LibraryFactory = await ethers.getContractFactory("UniswapV2Library");
  const uniswapV2Library = await uniswapV2LibraryFactory.deploy();
  console.log("UniswapV2Library contract deployed to:", uniswapV2Library.address);

  // Writer Contract address to file
  const flashLoanAddressFile = __dirname + "/../UniswapFlashloaner.json";
  fs.writeFileSync(
    flashLoanAddressFile,
    JSON.stringify({ uniswapFlashloanerAddress: uniFlashloaner.address, uniswapV2LibraryAddress:uniswapV2Library.address  }, undefined, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

