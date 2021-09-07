const { ethers }  = require('hardhat');

async function attach(name, address) {
  const contractFactory = await ethers.getContractFactory(name);
  return contractFactory.attach(address);
}

async function main() {
  const [admin, minter, relayer] = await ethers.getSigners();
  console.log(`Sign authorization:`);
  // console.log(`- admin:   ${admin.address} (${ethers.utils.formatEther(await admin.getBalance())} ${ethers.constants.EtherSymbol})`);
  // console.log(`- minter:  ${minter.address} (${ethers.utils.formatEther(await minter.getBalance())} ${ethers.constants.EtherSymbol})`);
  // console.log(`- relayer: ${relayer.address} (${ethers.utils.formatEther(await relayer.getBalance())} ${ethers.constants.EtherSymbol})`);

  const registry    = (await attach('ERC721LazyMintWith712', process.env.ADDRESS)).connect(minter);
  const { chainId } = await ethers.provider.getNetwork();
  const tokenId     = process.env.TOKENID || 1;
  const account     = process.env.ACCOUNT || '0xcd3b766ccdd6ae721141f452c550ca635964ce71';
  const signature   = await minter._signTypedData(
    // Domain
    {
      name: 'Name',
      version: '1.0.0',
      chainId,
      verifyingContract: registry.address,
    },
    // Types
    {
      NFT: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'account', type: 'address' },
      ],
    },
    // Value
    { tokenId, account },
  );

  console.log({ registry: registry.address, tokenId, account, signature });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
