// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");

async function main() {

  let lendingPoolProviderAddr;
  let network = hre.hardhatArguments.network;

  switch (network) {
    case "ropsten":
      lendingPoolProviderAddr = "0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728";
      break
    case "kovan":
      lendingPoolProviderAddr = "0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5";
      break
    case "matic":
      lendingPoolProviderAddr = "0x87A5b1cD19fC93dfeb177CCEc3686a48c53D65Ec";
      break
    default:
      throw console.error(`Are you deploying to the correct network? (network selected: ${network})`)
  }


  const flashloanFactory = await ethers.getContractFactory("Flashloan");
  const flashloan = await flashloanFactory.deploy(lendingPoolProviderAddr);

  await flashloan.deployed();

  console.log("Flashloan deployed to:", flashloan.address);

  // Writer Contract address to file
  const flashLoanAddressFile = __dirname + "/../FlashLoanAddress.json";
  fs.writeFileSync(
    flashLoanAddressFile,
    JSON.stringify({ address: flashloan.address }, undefined, 2)
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

