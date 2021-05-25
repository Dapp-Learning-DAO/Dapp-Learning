const Web3 = require('web3');
const fs = require("fs");
const contractFile = require('./compile');

const privatekey = fs.readFileSync("./sk.txt").toString().trim()

/*
   -- 定义 Provider --
*/
// Provider
const providerRPC = {
   development: 'https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07',
   moonbase: 'https://rpc.testnet.moonbeam.network',
};
const web3 = new Web3(providerRPC.development); //Change to correct network

// 使用私钥生成账户
const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
   privateKey: privatekey,
   accountAddress: account.address,
};

// 获取 abi 和 bin
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

/*
*
*
*   -- 合约部署验证 --
*

*/
const Trans = async () => {
   console.log("============================ 1. Deploy Contract");
   console.log(`Attempting to deploy from account ${account.address}`);

   // 创建合约实例
   const deployContract = new web3.eth.Contract(abi);

   // 构造部署合约的交易
   const deployTx = deployContract.deploy({
      data: bytecode,
      arguments: [5],
   });

   // 使用私钥对交易进行签名
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         data: deployTx.encodeABI(),
         gas: await deployTx.estimateGas(),
      },
      account_from.privateKey
   );

   // 发送合约部署交易，同时获取交易回执，并打印回执中返回的交易部署成功后的合约地址
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
   * -- 验证合约的 increment 接口 --
   * 
   * 
   */
   // 这里使用已经部署的合约地址进行构造
   console.log()
   console.log("============================ 2. Call Contract Interface getNumber");
   let incrementer = new web3.eth.Contract(abi, createReceipt.contractAddress);
   
   console.log(`Making a call to contract at address: ${createReceipt.contractAddress}`);

   // 调用合约的 getNumber 接口，获取合约中的公共变量 number 的当前值
   let number = await incrementer.methods.getNumber().call();
   console.log(`The current number stored is: ${number}`);

   // 构造交易，调用合约的另一个接口 increment, 为 number + 3
   console.log()
   console.log("============================ 3. Call Contract Interface increment");
   const _value = 3;
   const incrementTx = incrementer.methods.increment(_value);

   // 使用私钥对交易进行签名
   let incrementTransaction = await web3.eth.accounts.signTransaction(
      {
         to: createReceipt.contractAddress,
         data: incrementTx.encodeABI(),
         gas: await incrementTx.estimateGas(),
      },
      account_from.privateKey
   );

   // 发送交易，同时获取交易回执，答应回执中的交易 hash 
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
   * -- 验证合约的 reset 接口 --
   * 
   * 
   */
  console.log()
  console.log("============================ 4. Call Contract Interface reset");
  const resetTx = incrementer.methods.reset();

  // 使用私钥对交易进行签名
  const resetTransaction = await web3.eth.accounts.signTransaction(
   {
      to: createReceipt.contractAddress,
      data: resetTx.encodeABI(),
      gas: await resetTx.estimateGas(),
   },
   account_from.privateKey
   );

   // 发送交易，同时获取交易回执，答应回执中的交易 hash 
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
   * -- 监听合约 Increment 事件 --
   * 
   * 
   */
   console.log()
   console.log("============================ 5. Call Contract Interface reset");
   console.log("Mode 1: listen to event once")

   // kovan 测试网无法使用 http 进行 event 事件监听，需要使用 websocket
   // 具体可参考 https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a
   const web3Socket = new Web3(new Web3.providers.WebsocketProvider("wss://kovan.infura.io/ws/v3/0aae8358bfe04803b8e75bb4755eaf07"));
   incrementer = new web3Socket.eth.Contract(abi, createReceipt.contractAddress);

   // 只监听一次 Increment 事件
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
