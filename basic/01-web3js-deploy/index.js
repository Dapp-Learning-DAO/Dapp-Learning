let Web3 = require('web3');
let solc = require('solc');
let fs = require('fs');

// Get privatekey from sk.txt
require('dotenv').config('.env.example');
const privatekey = process.env.PRIVATE_KEY;

// Load contract
const source = fs.readFileSync('Incrementer.sol', 'utf8');

// compile solidity
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

// Get bin & abi
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// Create web3 with kovan provider，you can fix kovan to other testnet
const web3 = new Web3('https://kovan.infura.io/v3/' + process.env.INFURA_ID);

// Create account from privatekey
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
  privateKey: privatekey,
  accountAddress: account.address,
};

/*
   -- Deploy Contract --
*/
const Deploy = async () => {
  // Create contract instance
  const deployContract = new web3.eth.Contract(abi);

  // Create Tx
  const deployTx = deployContract.deploy({
    data: bytecode,
    arguments: [5],
  });

  // Sign Tx
  const deployTransaction = await web3.eth.accounts.signTransaction(
    {
      data: deployTx.encodeABI(),
      gas: 8000000,
    },
    account_from.privateKey
  );

  const deployReceipt = await web3.eth.sendSignedTransaction(
    deployTransaction.rawTransaction
  );
  console.log(`Contract deployed at address: ${deployReceipt.contractAddress}`);
};

Deploy();
