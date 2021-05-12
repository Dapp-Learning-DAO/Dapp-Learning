const ethers = require('ethers');
const fs = require("fs");
const contractFile = require('./compile');

const privatekey = fs.readFileSync("./sk.txt").toString().trim()

/*
   -- Define Provider & Variables --
*/
// Provider
const providerRPC = {
   development: {
      name: 'moonbeam-development',
      rpc: 'http://localhost:8545',
      chainId: 1281,
   },
   moonbase: {
      name: 'moonbase-alpha',
      rpc: 'https://rpc.testnet.moonbeam.network',
      chainId: 1287,
   },
};
const provider = new ethers.providers.InfuraProvider('kovan'); //Change to correct network

// Variables
const account_from = {
   privateKey: privatekey,
};

const abi = JSON.parse(contractFile.contracts[':BAC001'].interface);
const bytecode=contractFile.contracts[':BAC001'].bytecode;

// Create Wallet
let wallet = new ethers.Wallet(account_from.privateKey, provider);

/*
   -- Deploy Contract --
*/
// Create Contract Instance with Signer
const incrementer = new ethers.ContractFactory(abi, bytecode, wallet);

const Trans = async () => {
   console.log(`Attempting to deploy from account: ${wallet.address}`);

   // Send Tx (Initial Value set to 5) and Wait for Receipt
   const contract = await incrementer.deploy("hello","Dapp",1,100000000);
   await contract.deployed();

   console.log(`Contract deployed at address: ${contract.address}`);

   /*
   -- Send Function --
   */
   // Create Contract Instance
   const send = new ethers.Contract(contract.address, abi, wallet);

   console.log(
      `Transfer 100000 to address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   );

   // Call Contract
   const createReceipt = await send.send("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",100000, "fee");
   await createReceipt.wait();

   console.log(`Tx successful with hash: ${createReceipt.hash}`);

   /*
   -- Call Function --
   */
   // Create Contract Instance
   const balance = new ethers.Contract(contract.address, abi, provider);

   console.log(`Making a call to contract at address: ${contract.address}`);

   // Call Contract
   const data = await balance.balance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

   console.log(`balance of 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 is : ${data}`);
};

Trans();