const hre = require("hardhat");
require("@nomiclabs/hardhat-web3");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    // PRICE_FEED_CONTRACT 在 kovan 上的合约地址  
    const PRICE_FEED_CONTRACT="0x9326BFA02ADD2366b30bacB125260Af641031331";

    // 部署 PriceConsumerV3 合约
    const priceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
    const PriceConsumerV3Ins = await priceConsumerV3.deploy(PRICE_FEED_CONTRACT);

    console.log("----------------------------------------------------")
    console.log("PriceConsumerV3 address:", PriceConsumerV3Ins.address);

    //await priceConsumerV3.deployed()
    console.log("Read Price from  PRICE_FEED")

    await PriceConsumerV3Ins.getLatestPrice().then(function (data) {
        console.log('Current price of ETH / USD is: ', web3.utils.hexToNumber(data._hex))
      })
    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
