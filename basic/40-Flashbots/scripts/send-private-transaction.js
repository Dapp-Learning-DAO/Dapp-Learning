// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle');

const { BigNumber } = require( 'ethers');
require('dotenv').config();


async function main() {
  // Deploy Greeter.sol
  /* const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello Boy");

  console.log("Contract address:" , greeter.address); */
  let chainId = 11155111;
  // Config provider, the default is 
  const provider = new ethers.providers.JsonRpcProvider({ url: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID }, chainId)
  //const provider = new ethers.getDefaultProvider("goerli");
  // Standard json rpc provider directly from ethers.js. For example you can use Infura, Alchemy, or your own node.
  
  // Singer
  const signerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("signerWallet address: ", await signerWallet.getBalance() );

  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, signerWallet, "https://relay-sepolia.flashbots.net", "sepolia");
  // Flashbots provider requires passing in a standard provider and an auth signer
  const GWEI = BigNumber.from(10).pow(9)
  const ether = BigNumber.from(10).pow(18)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_USER2);
  console.log("wallet address: ", wallet.address);

  const block = await provider.getBlock("latest");
  const maxBaseFeeInFutureBlock =
  FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 1);
  const priorityFee = BigNumber.from(2).pow(13);

  const privateTx = 
      {
        signer: wallet,
        transaction: {
          to: "0xaD5F438dF4e1aAA18dd538215Eeb4D46C3688C62",
          type: 2,
          maxFeePerGas: priorityFee.add(maxBaseFeeInFutureBlock),
          maxPriorityFeePerGas: priorityFee,
          gasLimit: 33000,
          chainId: chainId,
          value: ether.div(5) ,
        },
      }
  


    const blockNumber = await provider.getBlockNumber();

    const minTimestamp = 1645753192;

    let  maxBlockNumber = blockNumber + 10;
  
      const bundleSubmission = await flashbotsProvider.sendPrivateTransaction(
        privateTx,  {maxBlockNumber, minTimestamp});


      console.log("submitted for block # ", blockNumber );

    
    console.log("bundles submitted");
  

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
