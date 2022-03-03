// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

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
    default:
      throw console.error(`Are you deploying to the correct network? (network selected: ${network})`)
  }

  const flashloanFactory = await ethers.getContractFactory("Flashloan");
  const flashloan = await flashloanFactory.deploy(lendingPoolProviderAddr);

  await flashloan.deployed();

  console.log("Flashloan deployed to:", flashloan.address);

  // const [deployer] = await ethers.getSigners();

  // console.log(
  //   "Deploying contracts with the account:",
  //   deployer.address
  // );

  // console.log("Account balance:", (await deployer.getBalance()).toString());

  // //deploy Crowdfunding
  // const crowdFundingContractFactory = await ethers.getContractFactory("CrowdFunding");
  // const crowdFundingContract = await crowdFundingContractFactory.deploy();
  // await crowdFundingContract.deployed()

  // console.log("CrowdFundingContract address:", crowdFundingContract.address);

  // //start Project
  // await crowdFundingContract.startProject("Buy toys", "Buy toys", 1, 100)
  // let allProjects = await crowdFundingContract.returnAllProjects()

  // const artifact = artifacts.readArtifactSync('Project')
  // let project
  // let details
  // for (let i = 0; i < allProjects.length; i++) {
  //   project = new ethers.Contract(allProjects[i], artifact.abi, deployer)
  //   details = await project.getDetails()
  //   console.log(details)
  // }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

