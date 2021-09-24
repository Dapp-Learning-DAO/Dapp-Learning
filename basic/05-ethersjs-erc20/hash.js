const { ethers } = require('ethers');
const fs = require('fs');
const contractFile = require('./compile');
//var sleep = require('sleep');

require('dotenv').config();
const privatekey = process.env.PRIVATE_KEY;

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
const provider = new ethers.providers.InfuraProvider(
  'kovan',
  process.env.INFURA_ID
); //Change to correct network

// Variables
const account_from = {
  privateKey: privatekey,
};

const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// hash test
console.log(
  '&&&1： mint: ',
  ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      'createAndInitializePoolIfNecessary(address,address,uint24,uint160)'
    )
  )
);
console.log(
  '&&&1： increase: ',
  ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      'mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))'
    )
  )
);
console.log(
  '&&&1： muticall: ',
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes('multicall(bytes[])'))
);
console.log(
  '&&&1： refund: ',
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes('refundETH()'))
);
// Create Wallet
let wallet = new ethers.Wallet(account_from.privateKey, provider);

/*
   -- Deploy Contract --
*/
// Create Contract Instance with Signer
const deployContractIns = new ethers.ContractFactory(abi, bytecode, wallet);

const Trans = async () => {
  console.log('===============================1. Deploy Contract');
  console.log(`Attempting to deploy from account: ${wallet.address}`);

  // Deploy the Contract
  const deployedContract = await deployContractIns.deploy(
    'hello',
    'Dapp',
    1,
    100000000
  );
  await deployedContract.deployed();

  console.log(`Contract deployed at address: ${deployedContract.address}`);

  /*
	-- Send Function --
	*/
  // Create Contract Instance
  console.log();
  console.log(
    '===============================2. Call Transaction Interface Of Contract'
  );
  const transactionContract = new ethers.Contract(
    deployedContract.address,
    abi,
    wallet
  );

  console.log(
    `Transfer 100000 to address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  );

  // Call Contract
  const transferReceipt = await transactionContract.transfer(
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    100000
  );
  await transferReceipt.wait();

  console.log(`Tx successful with hash: ${transferReceipt.hash}`);

  /*
	-- Call Function --
	*/
  // Create Contract Instance
  console.log();
  console.log(
    '===============================3. Call Read Interface Of Contract'
  );
  const providerContract = new ethers.Contract(
    deployedContract.address,
    abi,
    provider
  );

  // Call Contract
  const balanceVal = await providerContract.balanceOf(
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  );

  console.log(
    `balance of 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 is : ${balanceVal}`
  );

  /*
	-- Listen to Events --
	*/
  console.log();
  console.log('===============================4. Listen To Events');

  // Listen to event once
  providerContract.once('Transfer', (from, to, value) => {
    console.log(
      `I am a once Event Listener, I have got an event Transfer, from: ${from}   to: ${to}   value: ${value}`
    );
  });

  // Listen to events continuously
  providerContract.on('Transfer', (from, to, value) => {
    console.log(
      `I am a longstanding Event Listener, I have got an event Transfer, from: ${from}   to: ${to}   value: ${value}`
    );
  });

  // Listen to events with filter
  let topic = ethers.utils.id('Transfer(address,address,uint256)');
  let filter = {
    address: deployedContract.address,
    topics: [topic],
    fromBlock: await provider.getBlockNumber(),
  };

  providerContract.on(filter, (from, to, value) => {
    console.log(
      `I am a filter Event Listener, I have got an event Transfer, from: ${from}   to: ${to}   value: ${value}`
    );
  });

  for (let step = 0; step < 3; step++) {
    let transferTransaction = await transactionContract.transfer(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      10
    );
    await transferTransaction.wait();

    if (step == 2) {
      console.log('Going to remove all Listeners');
      providerContract.removeAllListeners();
    }
  }
};

//Trans();
