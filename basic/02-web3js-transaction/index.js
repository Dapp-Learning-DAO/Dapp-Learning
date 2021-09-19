const Web3 = require('web3');
const fs = require('fs');
const contractOfIncrementer = require('./compile');

require('dotenv').config();
const privatekey = process.env.PRIVATE_KEY;

/*
   -- Define Provider --
*/
// Provider
const providerRPC = {
  development: 'https://kovan.infura.io/v3/' + process.env.INFURA_ID,
  moonbase: 'https://rpc.testnet.moonbeam.network',
};
const web3 = new Web3(providerRPC.development); //Change to correct network

// Create account with privatekey
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
  privateKey: privatekey,
  accountAddress: account.address,
};

// Get abi & bin
const bytecode = contractOfIncrementer.evm.bytecode.object;
const abi = contractOfIncrementer.abi;

/*
*
*
*   -- Verify Deployment --
*

*/
const Trans = async () => {
  console.log('============================ 1. Deploy Contract');
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
      gas: 8000000,
    },
    account_from.privateKey
  );

  // Get Transaction Receipt
  const createReceipt = await web3.eth.sendSignedTransaction(
    createTransaction.rawTransaction
  );
  console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);

  const deployedBlockNumber = createReceipt.blockNumber;

  /*
   *
   *
   *
   * -- Verify Interface of Increment --
   *
   *
   */
  // Create the contract with contract address
  console.log();
  console.log(
    '============================ 2. Call Contract Interface getNumber'
  );
  let incrementer = new web3.eth.Contract(abi, createReceipt.contractAddress);

  console.log(
    `Making a call to contract at address: ${createReceipt.contractAddress}`
  );

  let number = await incrementer.methods.getNumber().call();
  console.log(`The current number stored is: ${number}`);

  // Add 3 to Contract Public Variable
  console.log();
  console.log(
    '============================ 3. Call Contract Interface increment'
  );
  const _value = 3;
  let incrementTx = incrementer.methods.increment(_value);

  // Sign with Pk
  let incrementTransaction = await web3.eth.accounts.signTransaction(
    {
      to: createReceipt.contractAddress,
      data: incrementTx.encodeABI(),
      gas: 8000000,
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
  console.log();
  console.log('============================ 4. Call Contract Interface reset');
  const resetTx = incrementer.methods.reset();

  const resetTransaction = await web3.eth.accounts.signTransaction(
    {
      to: createReceipt.contractAddress,
      data: resetTx.encodeABI(),
      gas: 8000000,
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
  console.log();
  console.log('============================ 5. Listen to Events');
  console.log(' Listen to Increment Event only once && continuouslly');

  // kovan don't support http protocol to event listen, need to use websocket
  // more details , please refer to  https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a
  const web3Socket = new Web3(
    new Web3.providers.WebsocketProvider(
      'wss://kovan.infura.io/ws/v3/' + process.env.INFURA_ID
    )
  );
  incrementer = new web3Socket.eth.Contract(abi, createReceipt.contractAddress);

  // listen to  Increment event only once
  incrementer.once('Increment', (error, event) => {
    console.log('I am a onetime event listner, I am going to die now');
  });

  // listen to Increment event continuouslly
  incrementer.events.Increment(() => {
    console.log('I am a longlive event listner, I get a event now');
  });

  for (let step = 0; step < 3; step++) {
    incrementTransaction = await web3.eth.accounts.signTransaction(
      {
        to: createReceipt.contractAddress,
        data: incrementTx.encodeABI(),
        gas: 8000000,
      },
      account_from.privateKey
    );

    await web3.eth.sendSignedTransaction(incrementTransaction.rawTransaction);

    if (step == 2) {
      // clear all the listeners
      web3Socket.eth.clearSubscriptions();
      console.log('Clearing all the events listeners !!!!');
    }
  }

  /*
   *
   *
   *
   * -- Get past events --
   *
   *
   */
  console.log();
  console.log('============================ 6. Going to get past events');
  const pastEvents = await incrementer.getPastEvents('Increment', {
    fromBlock: deployedBlockNumber,
    toBlock: 'latest',
  });

  pastEvents.map((event) => {
    console.log(event);
  });

  /*
   *
   *
   *
   * -- Check Transaction Error --
   *
   *
   */
  console.log();
  console.log('============================ 7. Check the transaction error');
  incrementTx = incrementer.methods.increment(0);
  incrementTransaction = await web3.eth.accounts.signTransaction(
    {
      to: createReceipt.contractAddress,
      data: incrementTx.encodeABI(),
      gas: 8000000,
    },
    account_from.privateKey
  );

  await web3.eth
    .sendSignedTransaction(incrementTransaction.rawTransaction)
    .on('error', console.error);
};

Trans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
