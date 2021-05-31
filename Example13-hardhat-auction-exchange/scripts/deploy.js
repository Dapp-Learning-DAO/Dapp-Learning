// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.


async function main() {
  // Deploy ERC20
  const erc20ContractFactory = await ethers.getContractFactory("SimpleToken");
  const erc20Contract = await erc20ContractFactory.deploy("ERC20","ERC20",1,100000);
  await erc20Contract.deployed();

  console.log("ERC20 Contract deployed at :", erc20Contract.address)
  saveAuctionFiles("SimpleToken",erc20Contract.address)
  // Save 

  //Deploy ERC721
  const erc721ContractFactory = await ethers.getContractFactory("MYERC721");
  const erc721Contract = await erc721ContractFactory.deploy("ERC721","ERC721");
  await erc721Contract.deployed();

  console.log("ERC721 Contract deployed at :", erc721Contract.address)
  saveAuctionFiles("MYERC721",erc721Contract.address)

  //Deploy AuctionFixedPrice
  const erc721ContractFactory = await ethers.getContractFactory("AuctionFixedPrice");
  const erc721Contract = await erc721ContractFactory.deploy("ERC721","ERC721");
  await erc721Contract.deployed();

  console.log("ERC721 Contract deployed at :", erc721Contract.address)
  saveAuctionFiles("MYERC721",erc721Contract.address)

}

function saveAuctionFiles(name,address) {
  const fs = require("fs")

  const contractsDir = __dirname + "/../auction-sample/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  const abi = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + "/" + name + ".json",
    JSON.stringify(abi, null, 2)
  );

  fs.writeFileSync(
    contractsDir + "/" + name + "-address.json",
    JSON.stringify({ address: address }, undefined, 2)
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
