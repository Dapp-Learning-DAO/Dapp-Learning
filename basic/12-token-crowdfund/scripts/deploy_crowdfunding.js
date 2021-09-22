// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    //deploy Crowdfunding
    const crowdFundingContractFactory = await ethers.getContractFactory("CrowdFunding");
    const crowdFundingContract = await crowdFundingContractFactory.deploy();
    await crowdFundingContract.deployed()

    console.log("CrowdFundingContract address:", crowdFundingContract.address);

    //start Project
    await crowdFundingContract.startProject("Buy toys","Buy toys",1,100)
    let allProjects = await crowdFundingContract.returnAllProjects()

    const artifact = artifacts.readArtifactSync('Project')
    let project
    let details
    for(let i=0; i<allProjects.length; i++) {
        project = new ethers.Contract(allProjects[i], artifact.abi, deployer)
        details = await project.getDetails()
        console.log(details)
    }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

