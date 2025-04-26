const Web3 = require('web3');
const contractFile = require('./compile');
const config = require('./config');
const ContractDeployer = require('./modules/deployer');
const ContractInteractor = require('./modules/interactor');
const EventListener = require('./modules/eventListener');
const { ErrorHandler } = require('./modules/errorHandler');

require('dotenv').config();

// Receiver address
const receiver = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Create Web3 instance
const web3 = new Web3(
  new Web3.providers.HttpProvider(config.networks.development.provider)
);

// Create account
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
const account_from = {
  privateKey: account.privateKey,
  accountaddress: account.address,
};

// Get contract bytecode and ABI
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

const main = async () => {
  try {
    // 1. Deploy contract
    const deployer = new ContractDeployer(web3, account_from);
    const contract = await deployer.deploy(abi, bytecode);

    // 2. Create contract interaction instance
    const interactor = new ContractInteractor(web3, contract);

    // 3. Transfer tokens
    await interactor.transfer(account_from, receiver, 100000);

    // 4. Query receiver balance
    await interactor.balanceOf(receiver);

    // 5. Create WebSocket connection for event listening
    const web3Socket = new Web3(
      `wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`
    );
    const socketContract = new web3Socket.eth.Contract(abi, contract.options.address);

    // 6. Setup event listener
    const eventListener = new EventListener(web3Socket, socketContract);
    await eventListener.subscribeToTransfers();

    // Wait for a while to receive events
    console.log('Waiting for events...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 7. Get historical transfer events
    const deployBlock = await web3.eth.getBlockNumber();
    await eventListener.getPastTransfers(deployBlock);

    // 8. Cleanup event subscriptions
    eventListener.unsubscribeAll();

  } catch (error) {
    await ErrorHandler.handle(error, web3);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
