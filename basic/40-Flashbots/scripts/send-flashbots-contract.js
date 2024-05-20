// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
const { BigNumber } = require( 'ethers');
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle');
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
   const Greeter = await ethers.getContractFactory("Greeter");
   const greeter = await Greeter.deploy("Hello Boy");

   console.log("Contract address:" , greeter.address); 

  // Config provider, the default is 
  const provider = new ethers.providers.JsonRpcProvider({ url: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID }, 11155111)
  //const provider = new ethers.getDefaultProvider("goerli");
  // Standard json rpc provider directly from ethers.js. For example you can use Infura, Alchemy, or your own node.

  // Singer
  const signerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, signerWallet, "https://relay-sepolia.flashbots.net", "sepolia" );
  // Flashbots provider requires passing in a standard provider and an auth signer

  // Get the playload
  const greeterArtifact = await hre.artifacts.readArtifact("Greeter");
  const contractPayload = getPayLoad(greeterArtifact.abi, "setGreeting", "Hello Girls", ['string']);
  
  const currentBlock = await provider.getBlockNumber();
  const targetBlockNumber = currentBlock + 2;

  console.log("Current block Number: ", currentBlock);

  let userNonce = await signerWallet.getTransactionCount();

  console.log("userNonce: ", userNonce)

  const GWEI = BigNumber.from(10).pow(9)
  const ETHER = BigNumber.from(10).pow(18)
  const LEGACY_GAS_PRICE = GWEI.mul(2000)

  const block = await provider.getBlock("latest");

  const maxBaseFeeInFutureBlock =
  FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 1);
  const priorityFee = BigNumber.from(2).pow(13);

  let chainId = 11155111;
  // Config the transaction
  const contractTransaction = {
    to: greeter.address,  // Existing Greeter contract's address on goerli
    type: 2,
    maxFeePerGas: priorityFee.add(maxBaseFeeInFutureBlock),
    maxPriorityFeePerGas: priorityFee,
    data: contractPayload,
    nonce: userNonce,
    chainId: chainId,
    value: 0 ,
  }

  const signedBundle = await flashbotsProvider.signBundle([
    {
        signer: signerWallet,
        transaction: contractTransaction
    }
  ])

  const simulation = await flashbotsProvider.simulate(signedBundle, targetBlockNumber);
  console.log(JSON.stringify(simulation, null, 2))

  const bundleReceipt = await flashbotsProvider.sendRawBundle(signedBundle, targetBlockNumber);
  
  await bundleReceipt.wait();
  console.log("Finish");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
