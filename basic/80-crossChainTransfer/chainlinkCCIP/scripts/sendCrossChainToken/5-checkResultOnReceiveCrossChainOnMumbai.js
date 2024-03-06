const { ethers }  = require('hardhat');
const {
  readRedpacketDeployment,
} = require("../../utils");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  // console.log(ethers)
  // CCIP-BnM token address on Polygon Mumbai is fixed
  const ccipBnM = await ethers.getContractAt('SimpleToken', "0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40", deployer);
  let balance = await ccipBnM.balanceOf(deployment.tokenTransferorReceiverAddress)

  console.log("ccipBnM balance of Mumbai side is: ",balance)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  // .then(() => process.exit(0))
  // .catch((error) => {
  //   console.error(error);
  //   process.exit(1);
  // });
