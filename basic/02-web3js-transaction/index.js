const Web3 = require('web3');
const fs = require('fs');
const contractOfIncrementer = require('./compile');

require('dotenv').config();
const privatekey = process.env.PRIVATE_KEY;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
   -- Define Provider --
*/
// Provider
const providerRPC = {
  development: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID,
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
// 将代码拆分为多个模块
// 1. 合约部署模块
// 2. 合约交互模块
// 3. 事件监听模块
// 4. 错误处理模块

// 示例改进结构
const ContractDeployer = require('./modules/deployer');
const ContractInteractor = require('./modules/interactor');
const EventListener = require('./modules/eventListener');
const ErrorHandler = require('./modules/errorHandler');

// 添加更细致的错误处理
class TransactionError extends Error {
  constructor(message, txHash) {
    super(message);
    this.name = 'TransactionError';
    this.txHash = txHash;
  }
}

const handleTransactionError = async (error, tx) => {
  console.error(`Transaction Failed: ${error.message}`);
  if (tx?.transactionHash) {
    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
    console.error(`Transaction Receipt:`, receipt);
  }
  // 可以添加错误上报逻辑
};

const Trans = async () => {
  try {
    // 1. 部署合约
    const deployer = new ContractDeployer(web3, account_from);
    const deployedContract = await deployer.deploy(bytecode, abi, [5]);

    // 2. 合约交互
    const interactor = new ContractInteractor(web3, deployedContract);
    await interactor.increment(3);
    await interactor.reset();

    // 3. 事件监听
    const listener = new EventListener(web3Socket, deployedContract);
    await listener.listenToIncrementEvents();

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

    // sepolia don't support http protocol to event listen, need to use websocket
    // more details , please refer to  https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a
    const web3Socket = new Web3(
      'wss://sepolia.infura.io/ws/v3/' + process.env.INFURA_ID
    );

    // listen to  Increment event only once
    incrementer.once('Increment', (error, event) => {
      console.log('I am a onetime event listner, I am going to die now');
    });

    // listen to Increment event continuously
    // 改进事件监听机制
    const setupEventListeners = (contract, web3Socket) => {
      const eventHandler = {
        onIncrement: (event) => {
          console.log('Increment Event:', event);
        },
        onReset: (event) => {
          console.log('Reset Event:', event);
        },
        onError: (error) => {
          console.error('Event Error:', error);
        },
      };

      return {
        startListening: () => {
          web3Socket.eth.subscribe('logs', {
            address: contract.options.address,
            topics: [],
          })
            .on('data', eventHandler.onIncrement)
            .on('error', eventHandler.onError);
        },
        stopListening: () => {
          web3Socket.eth.clearSubscriptions();
        },
      };
    };

    // listen to Increment event continuously
    web3Socket.eth.subscribe('logs', {
      address: createReceipt.contractAddress,
      topics: []
    }, (error, result) => {
      if (error) {
        console.error(error)
      }
    }
    ).on("data", (event) => {
      console.log("New event: ", event);
    })
      .on("error", (error) => {
        console.error("Error: ", error);
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

      console.log("Waiting for events")
      await sleep(3000);

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
  } catch (error) {
    ErrorHandler.handle(error);
  }
};

Trans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
