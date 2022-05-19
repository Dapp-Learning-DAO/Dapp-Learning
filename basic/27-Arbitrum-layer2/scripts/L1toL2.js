const { providers, Wallet } = require('ethers');
const hre = require('hardhat');
const ethers = require('ethers');
const { hexDataLength } = require('@ethersproject/bytes');
const { L1ToL2MessageGasEstimator } = require('@arbitrum/sdk/dist/lib/message/L1ToL2MessageGasEstimator');
const { arbLog, requireEnvVariables } = require('arb-shared-dependencies');
const { L1TransactionReceipt, L1ToL2MessageStatus } = require('@arbitrum/sdk');
require('dotenv').config();

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.PRIVATE_KEY;

const l1Provider = new providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`);
const l2Provider = new providers.JsonRpcProvider('https://rinkeby.arbitrum.io/rpc');

const l1Wallet = new Wallet(walletPrivateKey, l1Provider);
const l2Wallet = new Wallet(walletPrivateKey, l2Provider);

// Address of the Arbitrum_rinkeby Inbox on the L1 chain
INBOX_ADDR = '0x578bade599406a8fe3d24fd7f7211c0911f5b29e'; // rinkeby -> Arbitrum_one

const main = async () => {
  await arbLog('Cross-chain Greeter');

  /**
   * We deploy L1 Greeter to L1, L2 greeter to L2, each with a different "greeting" message.
   * After deploying, save set each contract's counterparty's address to its state so that they can later talk to each other.
   */
  const L1Greeter = await (await hre.ethers.getContractFactory('GreeterL1')).connect(l1Wallet); //
  console.log('Deploying L1 Greeter 👋');
  const l1Greeter = await L1Greeter.deploy(
    'Hello world in L1',
    ethers.constants.AddressZero, // temp l2 addr
    INBOX_ADDR
  );
  await l1Greeter.deployed();
  console.log(`deployed to ${l1Greeter.address}`);
  const L2Greeter = await (await hre.ethers.getContractFactory('GreeterL2')).connect(l2Wallet);

  console.log('Deploying L2 Greeter 👋👋');

  const l2Greeter = await L2Greeter.deploy(
    'Hello world in L2',
    ethers.constants.AddressZero // temp l1 addr
  );
  await l2Greeter.deployed();
  console.log(`deployed to ${l2Greeter.address}`);

  const updateL1Tx = await l1Greeter.updateL2Target(l2Greeter.address);
  await updateL1Tx.wait();

  const updateL2Tx = await l2Greeter.updateL1Target(l1Greeter.address);
  await updateL2Tx.wait();
  console.log('Counterpart contract addresses set in both greeters 👍');

  /**
   * Let's log the L2 greeting string
   */
  const currentL2Greeting = await l2Greeter.greet();
  console.log(`Current L2 greeting: "${currentL2Greeting}"`);

  console.log('Updating greeting from L1 to L2:');

  /**
   * Here we have a new greeting message that we want to set as the L2 greeting; we'll be setting it by sending it as a message from layer 1!!!
   */
  const newGreeting = 'Greeting from far, far away';

  /**
   * To send an L1-to-L2 message (aka a "retryable ticket"), we need to send ether from L1 to pay for the txn costs on L2.
   * There are two costs we need to account for: base submission cost and cost of L2 execution. We'll start with base submission cost.
   */

  /**
   * Base submission cost is a special cost for creating a retryable ticket; querying the cost requires us to know how many bytes of calldata out retryable ticket will require, so let's figure that out.
   * We'll get the bytes for our greeting data, then add 4 for the 4-byte function signature.
   */

  const newGreetingBytes = ethers.utils.defaultAbiCoder.encode(['string'], [newGreeting]);
  const newGreetingBytesLength = hexDataLength(newGreetingBytes) + 4; // 4 bytes func identifier

  /**
   * Now we can query the submission price using a helper method; the first value returned tells us the best cost of our transaction; that's what we'll be using.
   * The second value (nextUpdateTimestamp) tells us when the base cost will next update (base cost changes over time with chain congestion; the value updates every 24 hours). We won't actually use it here, but generally it's useful info to have.
   */
  const l1ToL2MessageGasEstimate = new L1ToL2MessageGasEstimator(l2Provider);

  const _submissionPriceWei = await l1ToL2MessageGasEstimate.estimateSubmissionFee(
    l1Provider,
    await l1Provider.getGasPrice(),
    newGreetingBytesLength
  );

  console.log(`Current retryable base submission price: ${_submissionPriceWei.toString()}`);

  /**
   * ...Okay, but on the off chance we end up underpaying, our retryable ticket simply fails.
   * This is highly unlikely, but just to be safe, let's increase the amount we'll be paying (the difference between the actual cost and the amount we pay gets refunded to our address on L2 anyway)
   * In nitro, submission fee will be charged in L1 based on L1 basefee, revert on L1 side upon insufficient fee.
   */
  const submissionPriceWei = _submissionPriceWei.mul(5);
  /**
   * Now we'll figure out the gas we need to send for L2 execution; this requires the L2 gas price and gas limit for our L2 transaction
   */

  /**
   * For the L2 gas price, we simply query it from the L2 provider, as we would when using L1
   */
  const gasPriceBid = await l2Provider.getGasPrice();
  console.log(`L2 gas price: ${gasPriceBid.toString()}`);

  /**
   * For the gas limit, we'll use the estimateRetryableTicketMaxGas method in Arbitrum SDK
   */

  /**
   * First, we need to calculate the calldata for the function being called (setGreeting())
   */
  const ABI = ['function setGreeting(string _greeting)'];
  const iface = new ethers.utils.Interface(ABI);
  const calldata = iface.encodeFunctionData('setGreeting', [newGreeting]);

  const maxGas = await l1ToL2MessageGasEstimate.estimateRetryableTicketMaxGas(
    l1Greeter.address,
    ethers.utils.parseEther('1'),
    l2Greeter.address,
    0,
    submissionPriceWei,
    l2Wallet.address,
    l2Wallet.address,
    100000,
    gasPriceBid,
    calldata
  );
  /**
   * With these three values, we can calculate the total callvalue we'll need our L1 transaction to send to L2
   */
  const callValue = submissionPriceWei.add(gasPriceBid.mul(maxGas));

  console.log(`Sending greeting to L2 with ${callValue.toString()} callValue for L2 fees:`);

  const setGreetingTx = await l1Greeter.setGreetingInL2(
    newGreeting, // string memory _greeting,
    submissionPriceWei,
    maxGas,
    gasPriceBid,
    {
      value: callValue,
    }
  );
  const setGreetingRec = await setGreetingTx.wait();

  console.log(`Greeting txn confirmed on L1! 🙌 ${setGreetingRec.transactionHash}`);

  const l1TxReceipt = new L1TransactionReceipt(setGreetingRec);

  /**
   * In principle, a single L1 txn can trigger any number of L1-to-L2 messages (each with its own sequencer number).
   * In this case, we know our txn triggered only one
   * Here, We check if our L1 to L2 message is redeemed on L2
   */
  const message = await l1TxReceipt.getL1ToL2Message(l2Wallet);
  const status = await message.waitForStatus();
  console.log(status);
  if (status === L1ToL2MessageStatus.REDEEMED) {
    console.log(`L2 retryable txn executed 🥳 ${message.l2TxHash}`);
  } else {
    console.log(`L2 retryable txn failed with status ${L1ToL2MessageStatus[status]}`);
  }

  /**
   * Note that during L2 execution, a retryable's sender address is transformed to its L2 alias.
   * Thus, when GreeterL2 checks that the message came from the L1, we check that the sender is this L2 Alias.
   * See setGreeting in GreeterL2.sol for this check.
   */

  /**
   * Now when we call greet again, we should see our new string on L2!
   */
  const newGreetingL2 = await l2Greeter.greet();
  console.log(`Updated L2 greeting: "${newGreetingL2}"`);
  console.log('✌️');
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
