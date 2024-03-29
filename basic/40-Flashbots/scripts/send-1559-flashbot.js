// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle');

const { BigNumber } = require( 'ethers');
require('dotenv').config();

function getPayLoad(contractABI, functionName, param, paramType){
  for(let i = 0; i < contractABI.length; i++){
    const functionABI = contractABI[i];
    if (functionName != functionABI.name) {
      continue;
    }

    //get sigHash of function
    const interface = new ethers.utils.Interface(contractABI);
    const functionSigHash = interface.getSighash(functionName);
    console.log("sign of method:%s is %s", functionName, functionSigHash);

    //encode param
    const abiCoder = new ethers.utils.AbiCoder()
    const codeOfParam = abiCoder.encode(paramType, [param])
    console.log("codeOfParam:", codeOfParam);

    //payload
    const payload = functionSigHash + codeOfParam.substring(2, codeOfParam.length);
    console.log("payload:", functionName, payload);
    return payload;
  }
}

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

  const signedTransactions = await flashbotsProvider.signBundle([
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
      },
      {
        signer: wallet,
        transaction: {
          to: "0x3DC9a3450a4955a2d702C655b414837F75eFE05D",
          type: 2,
          maxFeePerGas: priorityFee.add(maxBaseFeeInFutureBlock),
          maxPriorityFeePerGas: priorityFee,
          gasLimit: 43000,
          chainId: chainId,
          value: ether.div(10),
        },
      },
    ]);


    const blockNumber = await provider.getBlockNumber();


    // check 
    for (var i = 1; i <= 10; i++) {
      const bundleSubmission = await flashbotsProvider.sendRawBundle(
        signedTransactions,
        blockNumber + i
      );
      console.log("submitted for block # ", blockNumber + i);


      //type 2
      const minTimestamp = (await provider.getBlock(blockNumber)).timestamp
      const maxTimestamp = minTimestamp + 120

      const bundleReceipt = await flashbotsProvider.sendRawBundle(
        signedTransactions, // bundle we signed above
        blockNumber + 1, // block number at which this bundle is valid
        {
          minTimestamp, // optional minimum timestamp at which this bundle is valid (inclusive)
          maxTimestamp, // optional maximum timestamp at which this bundle is valid (inclusive)
       //   revertingTxHashes: [tx1, tx2] // optional list of transaction hashes allowed to revert. Without specifying here, any revert invalidates the entire bundle.
        })
    
    // const bundleSubmission = await flashbotsProvider.sendRawBundle(
    //       signedTransactions,
    //       blockNumber + 2); 
    // console.log("bundleSubmission", bundleSubmission)

    // if ("error" in bundleSubmission) {
    //   console.log(`bundleSubmission Error: ${bundleSubmission.error.message}`);
    // } else {
    //   console.log(
    //     `bundleSubmission Success: ${blockNumber} ${JSON.stringify(
    //       bundleSubmission,
    //       null,
    //       2
    //     )}`
    //   );
    // }

    // await bundleSubmission.wait();
    
    console.log("bundles submitted");
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
