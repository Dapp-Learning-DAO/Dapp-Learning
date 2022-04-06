const { ethers } = require('ethers');
const http = require('http');
const Web3 = require('web3');
const contracts = require('./deployed/contract.json');
const CONTRACT_NAME = 'Incrementer';
const abi = contracts[CONTRACT_NAME].abi;
let contractAddress = ''; // todo fill the contract address, depends on your local chain


const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// using web3
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));

// 6-sub contract events
function subContractEvents() {
  // using ethers
  async function subByEthers() {
    const readContract = new ethers.Contract(contractAddress, abi, provider);
    let filterForm = readContract.filters.Increment();
    readContract.on(filterForm, (amount, event) => {
      console.log('Increment events:', event);
    });
  }
  subByEthers();

  async function subByWeb3() {
    const contractInstance = new web3.eth.Contract(abi, contractAddress);
    contractInstance.events
      .Descrement({
        fromBlock: 0,
      })
      .on('data', (event) => {
        console.log('Descrement Event:', event); // same results as the optional callback above
      })
      .on('error', function (error, receipt) {
        console.error('Descrement Event error:', error);
      });
  }
  subByWeb3();
}

subContractEvents();

const server = http.createServer(() => {});
server.listen(8002);
