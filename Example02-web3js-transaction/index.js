const Web3 = require('web3');
const fs = require("fs");
const contractFile = require('./compile');

const privatekey = fs.readFileSync("./sk.txt").toString().trim()

/*
   -- Define Provider --
*/
// Provider
const providerRPC = {
   development: 'https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07',
   moonbase: 'https://rpc.testnet.moonbeam.network',
};
const web3 = new Web3(providerRPC.development); //Change to correct network

// Create account with privatekey
const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
   privateKey: privatekey,
   accountAddress: account.address,
};

// Get abi & bin
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

/*
*
*
*   -- Verify Deployment --
*

*/
const Trans = async () => {
   console.log("============================ 1. Deploy Contract");
   console.log(`Attempting to deploy from account ${account.address}`);

   // Create Contract Instance
   const deployContract = new web3.eth.Contract(abi);

   // Create Deployment Tx
   const deployTx = deployContract.deploy({
      data: bytecode,
      arguments: [5],
   });

   // Sign Tx
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         data: deployTx.encodeABI(),
         gas: await deployTx.estimateGas(),
      },
      account_from.privateKey
   );

   // Get Transaction Receipt
   const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
   );
   console.log(
      `Contract deployed at address: ${createReceipt.contractAddress}`
   );


   /*
   *
   *
   * 
   * -- Verify Interface of Increment --
   * 
   * 
   */
   // Create the contract with contract address
   console.log()
   console.log("============================ 2. Call Contract Interface getNumber");
   let incrementer = new web3.eth.Contract(abi, createReceipt.contractAddress);
   
   console.log(`Making a call to contract at address: ${createReceipt.contractAddress}`);

   let number = await incrementer.methods.getNumber().call();
   console.log(`The current number stored is: ${number}`);

   // Add 3 to Contract Public Variable
   console.log()
   console.log("============================ 3. Call Contract Interface increment");
   const _value = 3;
   const incrementTx = incrementer.methods.increment(_value);

   // Sign with Pk
   let incrementTransaction = await web3.eth.accounts.signTransaction(
      {
         to: createReceipt.contractAddress,
         data: incrementTx.encodeABI(),
         gas: await incrementTx.estimateGas(),
      },
      account_from.privateKey
   );

   // Send Transactoin and Get TransactionHash
   const incrementReceipt = await web3.eth.sendSignedTransaction(
      incrementTransaction.rawTransaction
   );
   console.log(`Tx successful with hash: ${incrementReceipt.transactionHash}`);

   number = await incrementer.methods.getNumber().call();
   console.log(`After increment, the current number stored is: ${number}`);


   /*
   *
   *
   * 
   * -- Verify Interface of Reset --
   * 
   * 
   */
  console.log()
  console.log("============================ 4. Call Contract Interface reset");
  const resetTx = incrementer.methods.reset();

  const resetTransaction = await web3.eth.accounts.signTransaction(
   {
      to: createReceipt.contractAddress,
      data: resetTx.encodeABI(),
      gas: await resetTx.estimateGas(),
   },
   account_from.privateKey
   );

   const resetcReceipt = await web3.eth.sendSignedTransaction(
      resetTransaction.rawTransaction
   );
   console.log(`Tx successful with hash: ${resetcReceipt.transactionHash}`);
   number = await incrementer.methods.getNumber().call();
   console.log(`After reset, the current number stored is: ${number}`);


   /*
   *
   *
   * 
   * -- Listen to Event Increment --
   * 
   * 
   */
   console.log()
   console.log("============================ 5. Call Contract Interface reset");
   console.log("Mode 1: listen to event once")

   // kovan don't support http protocol to event listen, need to use websocket
   // more details , please refer to  https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a
   const web3Socket = new Web3(new Web3.providers.WebsocketProvider("wss://kovan.infura.io/ws/v3/0aae8358bfe04803b8e75bb4755eaf07"));
   incrementer = new web3Socket.eth.Contract(abi, createReceipt.contractAddress);

   // listen to  Increment event only once
   incrementer.once('Increment', (error,event) => {
      console.log('Get event Increment, and the increment value is ', event.returnValues.value)
      process.exit(0)
   })

   incrementTransaction = await web3.eth.accounts.signTransaction(
   {
      to: createReceipt.contractAddress,
      data: incrementTx.encodeABI(),
      gas: await incrementTx.estimateGas(),
   },
   account_from.privateKey
   );

   await web3.eth.sendSignedTransaction(
      incrementTransaction.rawTransaction
   );
   
};

Trans();
