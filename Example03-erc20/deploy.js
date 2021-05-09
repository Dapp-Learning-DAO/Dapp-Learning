const Web3 = require('web3');
const contractFile = require('./compile');
var arguments = process.argv.splice(2);

if(arguments.length < 2 ){
   console.log("usage: node deploy.js --privateKey=xxxx --accountaddress=xxx");
   console.log("note: privateKey should be without prefix 0x");
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
   accountaddress: args.accountaddress,
};

const abi = JSON.parse(contractFile.contracts[':BAC001'].interface);
const bytecode=contractFile.contracts[':BAC001'].bytecode;


/*
   -- Deploy Contract --
*/
const deploy = async () => {
   console.log(`Attempting to deploy from account ${account_from.accountaddress}`);

   // Create Contract Instance
   const incrementer = new web3.eth.Contract(abi);

   // Create Constructor Tx
   const incrementerTx = incrementer.deploy({
      data: bytecode,
      arguments: ["hello","Dapp",1,100000000],
   });

   // Sign Transacation and Send
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         data: incrementerTx.encodeABI(),
         gas: await incrementerTx.estimateGas(),
      },
      account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
   );
   console.log(
      `Contract deployed at address: ${createReceipt.contractAddress}`
   );
};

deploy();
