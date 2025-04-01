const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const main = async () => {
  // Initialize wallet instance with private key and provider
  // const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // Get contract factory for BatchCallDelegation smart contract
  const BatchCallDelegation = await ethers.getContractFactory("BatchCallDelegation", deployer);
  
  // Deploy BatchCallDelegation contract
  console.log("Deploying BatchCallDelegation contract...");
  const batchCallDelegation = await BatchCallDelegation.deploy();
  
  // Wait until the contract is fully deployed on the blockchain
  await batchCallDelegation.waitForDeployment();
  
  const contractAddress = batchCallDelegation.target;
  console.log("BatchCallDelegation deployed to:", contractAddress);

  // Create deployment info object
  const deploymentInfo = {
    contractAddress: contractAddress,
    deploymentTime: new Date().toISOString(),
    network: network.name,
    deployer: deployer.address
  };

  // Ensure the deployments directory exists
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)){
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Save deployment info to JSON file
  const deploymentPath = path.join(deploymentDir, `${network.name}.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to ${deploymentPath}`);
}

main().then(() => {
  console.log('Deployment completed');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});