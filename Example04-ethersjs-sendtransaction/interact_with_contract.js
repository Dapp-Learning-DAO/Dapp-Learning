const ethers = require('ethers');
const { abi } = require('./compile');
var arguments = process.argv.splice(2);

if(arguments.length < 2 ){
    console.log("usage: node deploy.js --privateKey=xxxx --contractAddress=xxxx");
    console.log("note: all of the value should not be with prefix 0x");
    process.exit(1);
 }
 
 var args = require('minimist')(arguments);

/*
   -- Define Provider & Variables --
*/
// Provider
const providerRPC = {
   development: {
      name: 'moonbeam-development',
      rpc: 'http://localhost:8545',
      chainId: 1281,
   },
   moonbase: {
      name: 'moonbase-alpha',
      rpc: 'https://rpc.testnet.moonbeam.network',
      chainId: 1287,
   },
};
const provider = new ethers.providers.StaticJsonRpcProvider(
   providerRPC.development.rpc,
   {
      chainId: providerRPC.development.chainId,
      name: providerRPC.development.name,
   }
); //Change to correct network

// Variables
const account_from = {
   privateKey: args.privateKey,
};
const contractAddress = '0x' + args.contractAddress;
const _value = 3;

// Create Wallet
let wallet = new ethers.Wallet(account_from.privateKey, provider);

/*
   -- Send Function --
*/
// Create Contract Instance with Signer
const incrementer = new ethers.Contract(contractAddress, abi, wallet);
const increment = async () => {
   console.log(
      `Calling the increment by ${_value} function in contract at address: ${contractAddress}`
   );

   // Sign-Send Tx and Wait for Receipt
   const createReceipt = await incrementer.increment([_value]);
   await createReceipt.wait();

   console.log(`Tx successful with hash: ${createReceipt.hash}`);
};

increment();