const { ethers }  = require('hardhat');

async function attach(name, address) {
  const contractFactory = await ethers.getContractFactory(name);
  return contractFactory.attach(address);
}

async function main() {
  const [admin, minter, relayer] = await ethers.getSigners();
  console.log(`Redeem token:`);
  // console.log(`- admin:   ${admin.address} (${ethers.utils.formatEther(await admin.getBalance())} ${ethers.constants.EtherSymbol})`);
  // console.log(`- minter:  ${minter.address} (${ethers.utils.formatEther(await minter.getBalance())} ${ethers.constants.EtherSymbol})`);
  // console.log(`- relayer: ${relayer.address} (${ethers.utils.formatEther(await relayer.getBalance())} ${ethers.constants.EtherSymbol})`);

  const registry    = (await attach('ERC721LazyMintWith712', process.env.ADDRESS)).connect(relayer);
  const tokenId     = process.env.TOKENID || 1;
  const account     = process.env.ACCOUNT || '0xcd3b766ccdd6ae721141f452c550ca635964ce71';
  const signature   = process.env.SIGNATURE;

  const tx = await registry.redeem(account, tokenId, signature);
  const receipt = await tx.wait();

  console.log(receipt);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
