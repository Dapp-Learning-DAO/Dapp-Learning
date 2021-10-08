const Web3 = require('web3');
const fs = require('fs');
const contractFile = require('./compile');

require('dotenv').config();
const privatekey = process.env.PRIVATE_KEY;
/*
   -- Define Provider & Variables --
*/

const receiver = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Provider
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://kovan.infura.io/v3/' + process.env.INFURA_ID
  )
);

//account
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
  privateKey: account.privateKey,
  accountaddress: account.address,
};

// sol ---> abi + bin
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

/*
   -- Deploy Contract --
*/
const Trans = async () => {
  console.log(
    `Attempting to deploy from account ${account_from.accountaddress}`
  );
  web3.eth.getBlockNumber(function (error, result) {
    console.log(result);
  });
  // Create deploy Contract Instance
  const deployContract = new web3.eth.Contract(abi);

  // method 1
  // Create Constructor Tx
  const deployTx = deployContract.deploy({
    data: bytecode,
    arguments: ['DAPPLEARNING', 'DAPP', 0, 10000000],
  });

  // Sign Transacation and Send
  const deployTransaction = await web3.eth.accounts.signTransaction(
    {
      data: deployTx.encodeABI(),
      gas: '8000000',
    },
    account_from.privateKey
  );

  // Send Tx and Wait for Receipt
  const deployReceipt = await web3.eth.sendSignedTransaction(
    deployTransaction.rawTransaction
  );
  console.log(`Contract deployed at address: ${deployReceipt.contractAddress}`);

  // method 2 infura not support
  //    const deployTx2 = await deployContract.deploy({
  //       data: bytecode,
  //       arguments: ["hello","Dapp",1,100000000],
  //    }).send({
  //       from: '0x54A65DB20D7653CE509d3ee42656a8F138037d51',
  //       gas: 1500000,
  //       gasPrice: '30000000000000'}).
  //       then(function(newContractInstance){
  //       console.log(newContractInstance.options.address) // instance with the new contract address
  //    });

  const erc20Contract = new web3.eth.Contract(
    abi,
    deployReceipt.contractAddress
  );

  //build the Tx
  const transferTx = erc20Contract.methods
    .transfer(receiver, 100000)
    .encodeABI();

  // Sign Tx with PK
  const transferTransaction = await web3.eth.accounts.signTransaction(
    {
      to: deployReceipt.contractAddress,
      data: transferTx,
      gas: 8000000,
    },
    account_from.privateKey
  );

  // Send Tx and Wait for Receipt
  const transferReceipt = await web3.eth.sendSignedTransaction(
    transferTransaction.rawTransaction
  );

  await erc20Contract.methods
    .balanceOf(receiver)
    .call()
    .then((result) => {
      console.log(`The balance of receiver is ${result}`);
    });
};

Trans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
