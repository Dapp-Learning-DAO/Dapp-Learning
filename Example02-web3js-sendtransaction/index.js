const Web3 = require('web3');
const fs = require("fs");
const contractFile = require('./compile');

const privatekey = fs.readFileSync("./sk.txt").toString().trim()

/*
   -- Define Provider & Variables --
*/
// Provider
const providerRPC = {
   development: 'https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07',
   moonbase: 'https://rpc.testnet.moonbeam.network',
};
const web3 = new Web3(providerRPC.development); //Change to correct network

// account
const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
   privateKey: privatekey,
   accountAddress: account.address,
};

//abi & bin
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

/*
   -- Deploy Contract --
*/
const Trans = async () => {
   console.log(`Attempting to deploy from account ${account.address}`);

   // Create Contract Instance
   const deployContract = new web3.eth.Contract(abi);

   // Create Constructor Tx
   const deployTx = deployContract.deploy({
      data: bytecode,
      arguments: [5],
   });

   // Sign Transacation and Send
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         data: deployTx.encodeABI(),
         gas: await deployTx.estimateGas(),
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

   /*
   -- Call Function --
   */
   // Create Contract Instance
   const incrementer = new web3.eth.Contract(abi, createReceipt.contractAddress);
   
   console.log(`Making a call to contract at address: ${createReceipt.contractAddress}`);

   // Call Contract
   const data = await incrementer.methods.getNumber().call().then((result)=>{
      console.log(`The current number stored is: ${result}`);
   });

   // Build Increment Tx
   const _value = 3;
   const incrementTx = incrementer.methods.increment(_value);

   console.log(
      `Calling the increment by ${_value} function in contract at address: ${createReceipt.contractAddress}`
   );

   // Sign Tx with PK
   const createIncTransaction = await web3.eth.accounts.signTransaction(
      {
         to: createReceipt.contractAddress,
         data: incrementTx.encodeABI(),
         gas: await incrementTx.estimateGas(),
      },
      account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createIncReceipt = await web3.eth.sendSignedTransaction(
      createIncTransaction.rawTransaction
   );
   console.log(`Tx successful with hash: ${createIncReceipt.transactionHash}`);
   
};

Trans();
