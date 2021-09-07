const { ethers }  = require('hardhat');

async function deploy(name, ...params) {
  const contractFactory = await ethers.getContractFactory(name);
  return await contractFactory.deploy(...params).then(f => f.deployed());
}

async function main() {
  const [admin, minter, relayer] = await ethers.getSigners();
  console.log(`Deploying contracts:`);
  // console.log(`- admin:   ${admin.address} (${ethers.utils.formatEther(await admin.getBalance())} ${ethers.constants.EtherSymbol})`);
  // console.log(`- minter:  ${minter.address} (${ethers.utils.formatEther(await minter.getBalance())} ${ethers.constants.EtherSymbol})`);
  // console.log(`- relayer: ${relayer.address} (${ethers.utils.formatEther(await relayer.getBalance())} ${ethers.constants.EtherSymbol})`);

  const registry = (await deploy('ERC721LazyMintWith712', 'Name', 'Symbol')).connect(admin);
  await registry.grantRole(await registry.MINTER_ROLE(), minter.address);

  console.log({ registry: registry.address });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
