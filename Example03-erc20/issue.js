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

const shortname = erc20.methods.shortName().call().then(console.log);

console.log("the erc20 name is " + shortname);

const issueValue = async () => {
   console.log(
      `issue 100 to ${account_from.accountaddress}`
   );

   //build the Tx
   const issueTx = erc20.methods.issue(account_from.accountaddress,100,"Test");

   // Sign Tx with PK
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         to: contractAddress,
         data: issueTx.encodeABI(),
         gas: await issueTx.estimateGas(),
      },
      account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
   );
   console.log(`issue Tx successful with hash: ${createReceipt.transactionHash}`);


};

issueValue();
