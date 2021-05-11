const Web3 = require('web3');
const fs = require("fs");
const { abi } = require('./compile');


const privatekey = fs.readFileSync("./sk.txt").toString().trim()
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
const contractAddress = '0x668Fd29B310EC28fC373287189DBaE74D347030A';

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
