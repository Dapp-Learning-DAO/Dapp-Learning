/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, tenderly } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");

const main = async () => {

  console.log("\n\n 📡 Deploying...\n");

  const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

  let mainnetConfig = {
    lendingPoolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    uniswapRouterAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564"
  }  
  
  let maticConfig = {
    lendingPoolAddressesProvider: "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
    //sushi
    uniswapRouterAddress: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"
  }

  // Kovan Aave has a dedicated mock Uniswap contract... https://kovan.etherscan.io/address/0xC18451d36aA370fDACe8d45839bF975F48f7AEa1#readContract
  let kovanConfig = {
    lendingPoolAddressesProvider: "0x652B2937Efd0B5beA1c8d54293FC1289672AFC6b",
    uniswapRouterAddress: "0xfcd87315f0e4067070ade8682fcdbc3006631441"
  }

  let deployConfig = mainnetConfig
  console.log("lendingPoolAddressesProvider ", deployConfig.lendingPoolAddressesProvider)
 
  const aaveApe = await deploy("AaveApe",[deployConfig.lendingPoolAddressesProvider, deployConfig.uniswapRouterAddress])

  console.log(
    " 💾  Artifacts (address, abi, and args) saved to: ",
    chalk.blue("packages/hardhat/artifacts/"),
    "\n\n"
  );

  // Lengding pool deposite eth

  // borrow 

  // use aaveape to flashloan to repay borrow
  
};

const deploy = async (contractName, _args) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName);
  const deployed = await contractArtifacts.deploy(...contractArgs);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  console.log(
    " 📄",
    chalk.cyan(contractName),
    "deployed to:",
    chalk.magenta(deployed.address),
  );

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};


// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(["interface", "deploy"], deployed)
  ) {
    return "";
  }
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf(".sol") >= 0 && fileName.indexOf(".swp") < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
