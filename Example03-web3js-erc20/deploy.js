const Web3 = require('web3');
const fs = require("fs");
const contractFile = require('./compile');

const defaultNetwork = "kovan";

const privatekey = fs.readFileSync("./sk.txt").toString().trim()
/*
   -- Define Provider & Variables --
*/
// Provider
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


   const newbac = new web3.eth.Contract(abi, createReceipt.contractAddress);

   const shortname = newbac.methods.shortName().call().then(console.log);

  // newbac.methods.send("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",100000, "fee").send({from: '0x54A65DB20D7653CE509d3ee42656a8F138037d51'}).then(console.log);

   //build the Tx
   const tx = newbac.methods.send("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",100000, "fee").encodeABI();

   // Sign Tx with PK
   const createTransaction1 = await web3.eth.accounts.signTransaction(
       {
          to: createReceipt.contractAddress,
          data: tx,
          gas: 8000000,
       },
       account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createReceipt1 = await web3.eth.sendSignedTransaction(
       createTransaction1.rawTransaction
   );

   newbac.methods.balance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").call().then(console.log)
};

deploy();
