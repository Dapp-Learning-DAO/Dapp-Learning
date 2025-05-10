// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const { wrapProvider } = require('@account-abstraction/sdk'); 

async function main() {
  const [signer] = await ethers.getSigners();
  const entryPointAddress = "0x1306b01bC3e4AD202612D3843387e94737673F53";
  const config = {
    chainId: await ethers.provider.getNetwork().then(net => net.chainId),
    entryPointAddress,
    bundlerUrl: 'http://localhost:3000/rpc'
  } 

  
  const aaProvider = await wrapProvider(ethers.provider, config, signer);
  const walletAddress = await aaProvider.getSigner().getAddress();
  console.log(walletAddress);
  // send some eth to the wallet Address: wallet should have some balance to pay for its own creation, and for calling methods.
  
  // const myContract = new Contract(abi, aaProvider)
  
  // // this method will get called from the wallet address, through account-abstraction EntryPoint
  // await myContract.someMethod()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
