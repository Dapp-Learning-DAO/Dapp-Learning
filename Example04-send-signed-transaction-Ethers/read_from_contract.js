const ethers = require('ethers');
const { abi } = require('./compile');
var arguments = process.argv.splice(2);

if(arguments.length < 1 ){
    console.log("usage: node deploy.js --contractAddress=xxxx");
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
const contractAddress = '0x' + args.contractAddress;

/*
   -- Call Function --
*/
// Create Contract Instance
const incrementer = new ethers.Contract(contractAddress, abi, provider);

const get = async () => {
   console.log(`Making a call to contract at address: ${contractAddress}`);

   // Call Contract
   const data = await incrementer.number();

   console.log(`The current number stored is: ${data}`);
};

get();