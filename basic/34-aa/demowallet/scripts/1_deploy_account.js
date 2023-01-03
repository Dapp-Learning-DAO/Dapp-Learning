// This script deploys the aa account. We can also use initcode to deploy.
const {ethers} = require("hardhat");
const { wrapProvider } = require('@account-abstraction/sdk');

async function main() {
  const [signer] = await ethers.getSigners();
  const entryPointAddress = "0x1306b01bC3e4AD202612D3843387e94737673F53";
  const threshold = 3;
  const owner = await signer.getAddress();
  const DemoAccountFactory = await ethers.getContractFactory("DemoAccount", signer);
  const demoAccount = await DemoAccountFactory.deploy(entryPointAddress, threshold, owner);
  await demoAccount.deployed();
  console.log(`Deployed to ${demoAccount.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
