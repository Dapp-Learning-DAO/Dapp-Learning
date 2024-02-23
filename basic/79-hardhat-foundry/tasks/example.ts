import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";

export default async function example(
  params: any,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const ethers = hre.ethers;

  const [account] = await ethers.getSigners();

  console.log(
    `Balance for 1st account ${await account.getAddress()}: ${await account.getBalance()}`
  );
}
