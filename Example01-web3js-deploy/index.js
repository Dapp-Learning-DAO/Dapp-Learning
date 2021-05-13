let Web3 = require('web3');
let solc = require("solc");
let fs   = require('fs');

// Get the PrivateKey
const privatekey = fs.readFileSync("./sk.txt").toString().trim()

// Get Path and Load Contract
const source = fs.readFileSync('Incrementer.sol','utf8');

// Compile Contract
const input = {
   language: 'Solidity',
   sources: {
      'Incrementer.sol': {
         content: source,
      },
   },
   settings: {
      outputSelection: {
         '*': {
            '*': ['*'],
         },
      },
   },
};

const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
const contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];


//abi & bin
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// Create web3 Instance with Provider
const web3 = new Web3('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07'); 

// Create account with PK
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
	privateKey: privatekey,
	accountAddress: account.address,
 };

/*
   -- Deploy Contract --
*/
// Create Contract Instance
const Deploy = async () => {

	// Create Contract Instance
	const deployContract = new web3.eth.Contract(abi);

	// Create Constructor Tx
	const deployTx = deployContract.deploy({
	data: bytecode,
	arguments: [5],
	});

	// Sign Transacation and Send
	const deployTransaction = await web3.eth.accounts.signTransaction(
	{
		data: deployTx.encodeABI(),
		gas: await deployTx.estimateGas(),
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
}

Deploy();