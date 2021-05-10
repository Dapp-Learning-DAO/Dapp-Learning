const Web3 = require('web3');
const { abi } = require('./compile');
var arguments = process.argv.splice(2);

if(arguments.length < 1 ){
   console.log("usage: node deploy.js --contractAddress=xxxx");
   console.log("note: all the value should not be with prefix 0x");
   process.exit(1);
}

var args = require('minimist')(arguments);

/*
   -- Define Provider & Variables --
*/
// Provider
const providerRPC = {
   development: 'http://localhost:8545',
   moonbase: 'https://rpc.testnet.moonbeam.network',
};
const web3 = new Web3(providerRPC.development); //Change to correct network

// Variables
const contractAddress = '0x' + args.contractAddress;

/*
   -- Call Function --
*/
// Create Contract Instance
const incrementer = new web3.eth.Contract(abi, contractAddress);

const get = async () => {
   console.log(`Making a call to contract at address: ${contractAddress}`);

   // Call Contract
   const data = await incrementer.methods.getNumber().call().then((result)=>{
      console.log(`The current number stored is: ${result}`);
   });
};

get();
