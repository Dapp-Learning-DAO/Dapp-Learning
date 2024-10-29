const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
    const singer = await ethers.getSigner(process.env.PUBLIC_ADDRESS);
    console.log("Deploying contracts with the account:", singer.address);

    // PRICE_FEED_CONTRACT 在 sepolia 上的合约地址
    const PRICE_FEED_CONTRACT = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

    // deploy PriceConsumerV3 Contract
    const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
    const PriceConsumerV3Ins = await PriceConsumerV3.deploy(PRICE_FEED_CONTRACT);
    await PriceConsumerV3Ins.waitForDeployment();

    console.log("----------------------------------------------------");
    console.log("PriceConsumerV3 address:", await PriceConsumerV3Ins.getAddress());

    // 读取价格
    console.log("Read Price from PRICE_FEED");
    const latestPrice = await PriceConsumerV3Ins.getLatestPrice();
    console.log('Current price of ETH / USD is: ', latestPrice.toString());

    // 使用 singer 获取合约
    const contract = await ethers.getContractAt("PriceConsumerV3", await PriceConsumerV3Ins.getAddress(), singer);
    const latestPriceFromContract = await contract.getLatestPrice();
    console.log('Current price of ETH / USD from contract is: ', latestPriceFromContract.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
      console.error(error);
      process.exit(1);
  });
