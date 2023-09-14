// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log("Network ChainId:", (await ethers.provider.getNetwork()).chainId);

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const factoryContractDeployer = await ethers.getContractFactory("ExampleContractFactory");
    const contractDeployer = await ethers.getContractFactory("ExampleContract");
    const factoryContractdeployed = await factoryContractDeployer.deploy()
  
    const exampleParam = 1
    const salt = 1
  
    const exampleContractBytecode = await factoryContractdeployed.getBytecode(exampleParam);
    console.log("bytecode" , exampleContractBytecode)
    
    const contractAddress = await factoryContractdeployed.getAddress(exampleContractBytecode, salt);
    console.log("contract address calculated",contractAddress)
    
    const contract = await contractDeployer.attach(contractAddress)
  
    const deploy = await factoryContractdeployed.deployDeterministically(exampleParam,salt)

    const receipt = await deploy.wait();
  
    console.log("Factory deployed to:", receipt.events[0].args.contractAddress);

    // let  val = await contract.exampleVariable();
    
    // console.log("exampleVariable ", val);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
