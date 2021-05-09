const Web3 = require('web3');
const contractFile = require('./compile');
var arguments = process.argv.splice(2);

if(arguments.length < 3 ){
   console.log("usage: node deploy.js --privateKey=xxxx --accountaddress=xxx --contractAddress=xxx");
   console.log("note: all of the value should not be with prefix 0x");
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
const account_from = {
   privateKey: args.privateKey,
   accountaddress: '0x' + args.accountaddress,
};

const abi = JSON.parse(contractFile.contracts[':BAC001'].interface);
const contractAddress = '0x' + args.contractAddress;

/*
   -- Send Function --
*/
// Create Contract Instance
const erc20 = new web3.eth.Contract(abi, contractAddress);


const transfer = async () => {
   console.log(
      `transfer 10 to 0x464d91C2A2cc62d3cf6E8a6CCEF2c55D1f037545`
   );

   //build the Tx
   const transferTx = erc20.methods.send('0x464d91C2A2cc62d3cf6E8a6CCEF2c55D1f037545',10,"Test");

   // Sign Tx with PK
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         to: contractAddress,
         data: transferTx.encodeABI(),
         gas: await transferTx.estimateGas(),
      },
      account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
   );
   console.log(`transfer Tx successful with hash: ${createReceipt.transactionHash}`);


};

transfer();
