const hre = require("hardhat");
require("@nomiclabs/hardhat-web3");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    // PRICE_FEED_CONTRACT 在 goerli 上的合约地址  
    const PRICE_FEED_CONTRACT="0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

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
