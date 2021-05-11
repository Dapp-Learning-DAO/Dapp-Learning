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

const  account = web3.eth.accounts.privateKeyToAccount(privatekey);

// Variables
const account_from = {
   privateKey: account.privatekey,
   accountaddress: account.address,
};

const abi = JSON.parse(contractFile.contracts[':BAC001'].interface);
const contractAddress = '0x02233e07d9Ce57b64E9ceD594beB44fb7652d3B6';

/*
   -- Send Function --
*/
// Create Contract Instance
const erc20 = new web3.eth.Contract(abi, contractAddress);

const shortname = erc20.methods.shortName().call().then( (result) => {
   console.log('The shortname of erc20 is ' + result);
});


const issueValue = async () => {
   console.log(
      `issue 100 to ${account_from.accountaddress}`
   );

   //build the Tx
   const issueTx = erc20.methods.issue('0xF38fD1cc5DfCdEaF1564a49be142450aD357889D',100,"Test");

   // Sign Tx with PK
   const createTransaction = await web3.eth.accounts.signTransaction(
      {
         to: contractAddress,
         data: issueTx.encodeABI(),
         gas: "8000000",
      },
      account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
   );
   console.log(`issue Tx successful with hash: ${createReceipt.transactionHash}`);


};

issueValue();
