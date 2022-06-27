const hre = require("hardhat");
const { readConfig, setConfig } = require("./config");

const config = readConfig();

async function main() {
  const network = hre.network.name;
  const WyvernTokenTransferProxy = await hre.ethers.getContractFactory(
    "WyvernTokenTransferProxy"
  );

  const proxyRegistryAddress = config.deployed[network]["WyvernProxyRegistry"];
  /**
   * @oaram0 proxyRegistryAddress
   */
  const instance = await WyvernTokenTransferProxy.deploy(proxyRegistryAddress);
  await instance.deployed();
  console.log(instance.address);
  setConfig(
    "deployed." + network + ".WyvernTokenTransferProxy",
    instance.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
