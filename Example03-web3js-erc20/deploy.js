const Web3 = require('web3');
const fs = require("fs");
const contractFile = require('./compile');

const defaultNetwork = "kovan";

const privatekey = fs.readFileSync("./sk.txt").toString().trim()
/*
   -- Define Provider & Variables --
*/
// Provider
const providerRPC = {
   development: 'https://rinkeby.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847',
   moonbase: 'https://rpc.testnet.moonbeam.network',
};
//const web3 = new Web3(providerRPC.development); //Change to correct network

const web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07'));

// Variables

const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
   privateKey: account.privateKey,
   accountaddress: account.address,
};

const abi = JSON.parse(contractFile.contracts[':BAC001'].interface);
const bytecode=contractFile.contracts[':BAC001'].bytecode;


/*
   -- Deploy Contract --
*/
const deploy = async () => {
   console.log(`Attempting to deploy from account ${account_from.accountaddress}`);
   web3.eth.getBlockNumber(function (error, result) {
      console.log(result)
   })
   // Create Contract Instance
   const bac = new web3.eth.Contract(abi);


   // Create Constructor Tx
   const incrementerTx = bac.deploy({
      data: bytecode,
      arguments: ["hello","Dapp",1,100000000],
   });
   console.log("&&&&&&&7")
   // Sign Transacation and Send
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         data: incrementerTx.encodeABI(),
         gas: "8000000",
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
