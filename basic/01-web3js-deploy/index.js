let Web3 = require('web3');
let solc = require('solc');
let fs = require('fs');

// Get privatekey from environment
require('dotenv').config();
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

// Create web3 with custom test net provider，you can change test net in .env file with the key TEST_NET
const web3 = new Web3(`https://${process.env.TEST_NET}.infura.io/v3/` + process.env.INFURA_ID);

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
    arguments: [5],  // Pass arguments to the contract constructor on deployment(_initialNumber in Incremental.sol)
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
 
  // Your deployed contrac can be viewed at: https://${process.env.TEST_NET}.etherscan.io/address/${deployReceipt.contractAddress}
  // You can change test net in above url to your selected testnet. 
  console.log(`Contract deployed at address: ${deployReceipt.contractAddress}`);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
Deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
