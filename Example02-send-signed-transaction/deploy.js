const Web3 = require('web3');
const contractFile = require('./compile');

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
   privateKey: '0f6c9eceee317d3e24b22c6bafef6554e5c60adb0a5db2de685a07a8167e03e3',
   address: '0x1587C2A47a9C97a78788072121bC6c1C2c4e9115',
};
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

/*
   -- Deploy Contract --
*/
const deploy = async () => {
   console.log(`Attempting to deploy from account ${account_from.address}`);

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
