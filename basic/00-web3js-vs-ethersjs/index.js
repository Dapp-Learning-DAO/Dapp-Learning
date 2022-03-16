const { ethers } = require('ethers');
const Web3 = require('web3');
const contracts = require('./deployed/contract.json');
const CONTRACT_NAME = 'Incrementer';
const abi = contracts[CONTRACT_NAME].abi;
const bytecode = contracts[CONTRACT_NAME].evm.bytecode.object;
const gasLimit = 5000000;
const gasPrice = '20000000000'; // default gas price in wei, 20 gwei in this case
let contractAddress = '0xb24e870C592213B955bc2714A94c8b5D2FB31081'; // todo fill the contract address, depends on your local chain

// 1-connecting to Ethereum
// using ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();
// using web3
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
// or
// const web3 = new Web3('http://localhost:8545');

// 2-fetching accounts
async function getAccounts() {
  // using ethers
  const accounts1 = await provider.listAccounts();
  console.log(accounts1);

  // using web3
  const accounts2 = await web3.eth.getAccounts();
  console.log(accounts2);
}
// getAccounts();

//3-deploy contract
function deployContract() {
  // using ethers
  async function deployByEthers() {
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contractInstance = await factory.deploy(0);
    const tx = await contractInstance.deployTransaction.wait();
    console.log(tx);
    console.log('Contract deployed at address:', contractInstance.address); // instance with the new contract address
  }
  deployByEthers();

  // using web3
  async function deployByWeb3() {
    const accounts = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(abi);
    const tx = contract.deploy({
      data: bytecode,
      arguments: [0],
    });
    // const deployReceipt = tx.send({
    //   from: accounts[0],
    //   gas: gasLimit,
    //   gasPrice,
    // });
    // deployReceipt.on('receipt', function (receipt) {
    //   console.log(`Contract deployed at address: ${receipt.contractAddress}`); // contains the new contract address
    // });
    const contractInstance = await tx.send({
      from: accounts[0],
      gas: gasLimit,
      gasPrice,
    });
    console.log('Contract deployed at address:', contractInstance.options.address); // instance with the new contract address
  }
  deployByWeb3();
}
// deployContract();

// 4-call contract methods
function callContractMethods() {
  // using ethers
  async function callByEthers() {
    const readContract = new ethers.Contract(contractAddress, abi, provider);
    let currentValue = await readContract.currentValue();
    console.log('Incrementer Contract currentValue:', currentValue.toString());
    const writeContract = new ethers.Contract(contractAddress, abi, signer);
    const tx = await writeContract.increment(ethers.BigNumber.from(5));
    await tx.wait();
    currentValue = await readContract.currentValue();
    console.log('Incrementer Contract currentValue:', currentValue.toString());
  }
  // callByEthers();

  // using ethers
  async function callByWeb3() {
    const accounts = await web3.eth.getAccounts();
    const contractInstance = new web3.eth.Contract(abi, contractAddress);
    let currentValue = await contractInstance.methods.currentValue().call();
    console.log('Incrementer Contract currentValue:', currentValue);
    const tx = contractInstance.methods.descrement(1);
    await tx
      .send({
        from: accounts[0],
        gas: gasLimit,
        gasPrice,
      })
      .on('receipt', async (recepit) => {
        currentValue = await contractInstance.methods.currentValue().call();
        console.log('Incrementer Contract currentValue:', currentValue);
      });
  }
  callByWeb3();
}
callContractMethods();
