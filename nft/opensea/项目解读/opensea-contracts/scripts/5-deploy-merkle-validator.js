const { updateConfig, setConfig } = require("./config");

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`network = ${network}`);

  const account = await ethers.getSigner();

  const balance = await account.getBalance();
  console.log(
    `account.address = ${account.address}, account.balance = ${balance}`
  );

  const MerkleValidator = await hre.ethers.getContractFactory(
    "MerkleValidator"
  );
  const estimatedGas = await ethers.provider.estimateGas(
    MerkleValidator.getDeployTransaction().data
  );
  console.log(`estimatedGas = ${estimatedGas}`);
  const instance = await MerkleValidator.deploy();
  await instance.deployed();
  console.log(instance.address);
  setConfig("deployed." + network + ".MerkleValidator", instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
