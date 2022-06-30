// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { readConfig, setConfig } = require("./config");
const config = readConfig();

async function main() {
  const network = hre.network.name;
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const WyvernExchangeWithBulkCancellations =
    await hre.ethers.getContractFactory("WyvernExchangeWithBulkCancellations");

  const proxyRegistryAddress = config.deployed[network]["WyvernProxyRegistry"];
  const tokenTransferProxyAddress =
    config.deployed[network]["WyvernTokenTransferProxy"];
  let testTokenProxyAddress = config.deployed[network]["TestToken"];

  if (!testTokenProxyAddress) {
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    const tokenInstance = await TestToken.deploy();
    await tokenInstance.deployed();
    setConfig("deployed." + network + ".TestToken", tokenInstance.address);
    testTokenProxyAddress = tokenInstance.address;
  }

  console.log("test-token address", testTokenProxyAddress);
  console.log(`proxyRegistryAddress = ${proxyRegistryAddress}`);
  console.log(`tokenTransferProxyAddress = ${tokenTransferProxyAddress}`);
  /**
   * @param0  ProxyRegistry registryAddress,
     @param1  TokenTransferProxy tokenTransferProxyAddress,
     @param2  ERC20 tokenAddress,
     @param3  address protocolFeeAddress
   */
  const instance = await WyvernExchangeWithBulkCancellations.deploy(
    proxyRegistryAddress,
    tokenTransferProxyAddress,
    testTokenProxyAddress,
    "0x3ea0C9755aaA79e9C7F9fE31062BDCCbDB20F7A6"
  );
  await instance.deployed();
  setConfig(
    "deployed." + network + ".WyvernExchangeWithBulkCancellations",
    instance.address
  );
  console.log(
    `WyvernExchangeWithBulkCancellationsAddress = ${instance.address}`
  );

  const WyvernProxyRegistry = await hre.ethers.getContractFactory(
    "WyvernProxyRegistry"
  );
  const proxyInstance = await WyvernProxyRegistry.attach(proxyRegistryAddress);
  await proxyInstance.grantInitialAuthentication(instance.address);
  // 上面没执行成功，手动执行；
  // const estimatedGas =
  //   await proxyInstance.estimateGas.grantInitialAuthentication(
  //     "0xf211E5b8047f62F045cB2e05C10e73C91F6462DB"
  //   );
  // console.log(`estimatedGas = ${estimatedGas}`);
  // await proxyInstance.grantInitialAuthentication(
  //   "0xf211E5b8047f62F045cB2e05C10e73C91F6462DB"
  // );
  console.log("grantInitialAuthentication成功");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
