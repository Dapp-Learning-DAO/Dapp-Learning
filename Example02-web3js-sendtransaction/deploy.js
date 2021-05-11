const Web3 = require('web3');
const fs = require("fs");
const contractFile = require('./compile');

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

const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
// Variables
const account_from = {
   privateKey: privatekey,
   accountAddress: account,
};
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
/*
   -- Deploy Contract --
*/
const deploy = async () => {
   console.log(`Attempting to deploy from account ${account}`);

   // Create Contract Instance
   const incrementer = new web3.eth.Contract(abi);

   // Create Constructor Tx
   const incrementerTx = incrementer.deploy({
      data: bytecode,
      arguments: [5],
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
