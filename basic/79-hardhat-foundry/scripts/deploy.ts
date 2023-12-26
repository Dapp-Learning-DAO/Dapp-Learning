import { ethers } from "hardhat";

async function main() {
  const example = await ethers.deployContract("Example");
  await example.waitForDeployment();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
