const ethers = require('ethers');
const contractFile = require('./compile');
var arguments = process.argv.splice(2);

if(arguments.length < 1 ){
   console.log("usage: node deploy.js --privateKey=xxxx");
   console.log("note: privateKey should be without prefix 0x");
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
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// Create Wallet
let wallet = new ethers.Wallet(account_from.privateKey, provider);

/*
   -- Deploy Contract --
*/
// Create Contract Instance with Signer
const incrementer = new ethers.ContractFactory(abi, bytecode, wallet);

const deploy = async () => {
   console.log(`Attempting to deploy from account: ${wallet.address}`);

   // Send Tx (Initial Value set to 5) and Wait for Receipt
   const contract = await incrementer.deploy([5]);
   await contract.deployed();

   console.log(`Contract deployed at address: ${contract.address}`);
};

deploy();