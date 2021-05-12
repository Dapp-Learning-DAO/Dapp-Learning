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

const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

/*
   -- Deploy Contract --
*/
const Trans = async () => {
   console.log(`Attempting to deploy from account ${account_from.accountaddress}`);
   web3.eth.getBlockNumber(function (error, result) {
      console.log(result)
   })
   // Create deploy Contract Instance
   const deployContract = new web3.eth.Contract(abi);


   // Create Constructor Tx
   const deployTx = deployContract.deploy({
      data: bytecode,
      arguments: ["hello","Dapp",1,100000000],
   });
   console.log("&&&&&&&7")
   // Sign Transacation and Send
   const deployTransaction = await web3.eth.accounts.signTransaction(
      {
         data: deployTx.encodeABI(),
         gas: "8000000",
      },
      account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const deployReceipt = await web3.eth.sendSignedTransaction(
      deployTransaction.rawTransaction
   );
   console.log(
      `Contract deployed at address: ${deployReceipt.contractAddress}`
   );


   const transferContract = new web3.eth.Contract(abi, deployReceipt.contractAddress);

  // newbac.methods.send("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",100000, "fee").send({from: '0x54A65DB20D7653CE509d3ee42656a8F138037d51'}).then(console.log);

   //build the Tx
   const transferTx = transferContract.methods.transfer("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",100000).encodeABI();

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

   transferContract.methods.balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").call().then((result)=>{
      console.log(`The balance of 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 is ${result}`);
   })
};

Trans();
