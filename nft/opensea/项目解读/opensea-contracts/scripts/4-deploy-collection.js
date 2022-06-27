const hre = require("hardhat");
const { readConfig, setConfig } = require("./config");
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const config = readConfig();

async function main() {
  const network = hre.network.name;
  console.log(`network = ${network}`);

  const account = await ethers.getSigner();

  const balance = await account.getBalance();
  console.log(
    `account.address = ${account.address}, account.balance = ${balance}`
  );

  const AssetContractShared = await hre.ethers.getContractFactory(
    "AssetContractShared"
  );
  /**
   * @param0 name
   * @param1 symbol
   * @oaram2 proxyRegistryAddress
   * @param3 templateURI
   * @param4 migrationAddress // 用来迁移的，第一次部署时不需要
   */
  const proxyRegistryAddress = config.deployed[network]["WyvernProxyRegistry"];

  const estimatedGas = await ethers.provider.estimateGas(
    AssetContractShared.getDeployTransaction(
      "Opensea Collections",
      "OpenSTORE",
      proxyRegistryAddress,
      "",
      ADDRESS_ZERO
    ).data
  );
  console.log(`estimatedGas = ${estimatedGas}`);

  const instance = await AssetContractShared.deploy(
    "Opensea Collections",
    "OpenSTORE",
    proxyRegistryAddress,
    "",
    ADDRESS_ZERO,
    {
      // gas: 63000,
    }
  );
  await instance.deployed();
  console.log(instance.address);
  setConfig("deployed." + network + ".AssetContractShared", instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
