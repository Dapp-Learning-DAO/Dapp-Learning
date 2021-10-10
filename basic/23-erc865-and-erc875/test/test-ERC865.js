const { expect } = require("chai");

global.timestamp = Math.floor(Date.now() / 1000) + 20; // now + 60 seconds to allow for further testing when not allowed
const BigNumber = require('bignumber.js');
const ethUtil = require('ethereumjs-util');
//const utils = require('./utils');

const formattedAddress = address => Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
const formattedInt = int => ethUtil.setLengthLeft(int, 32);
const formattedBytes32 = bytes => ethUtil.addHexPrefix(bytes.toString('hex'));
const hashedTightPacked = args => ethUtil.keccak256(Buffer.concat(args));

  
 
describe('ERC865 compatible logic', async () => {

  let owner;
  let alice;
  let bob;
  let charlie;
  let dTokenOwner;

  beforeEach(async function () {
    // get addresses
    [owner,alice,bob,charlie] =  await hre.ethers.getSigners();

    // Deploy DToken contract
    const dTokenContractFactory = await ethers.getContractFactory("DToken");
    dTokenOwner = await dTokenContractFactory.deploy("HEHE", "HH", 1, 100000000);

    // Transfer 5000 tokens from owner to addr1
    await dTokenOwner.transfer(alice.address, 5000);
  });


  it('Charlie transfers 100 tokens from Alice to Bob (fee=10)', async () => {

    // target address for the transfer
    const to = bob.address;
    // delegate address who will do the transfer actually
    const delegate = charlie.address;
    // delegate fee
    const fee = 1;
    // transfer amount to the target address
    const amount = 10;

    let components;

    // use for transaction , each time, it should be different
    let nonce;

    // Before transaction, get the balance of alice
    let oldAliceBalance = await dTokenOwner.balanceOf(alice.address);

    // nonce = await web3.eth.getTransactionCount(alice.address);
    nonce = 1;

    // Assembling the transfer info
    components = [
      /* "0d98dcb1": getTransferPreSignedHash(address,address,uint256,uint256,uint256) */
      Buffer.from('0d98dcb1', 'hex'),
      formattedAddress(dTokenOwner.address),
      formattedAddress(to),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
    ];

    let messageHash = hashedTightPacked(components);
    let message_bytes = ethers.utils.arrayify(messageHash);

    // Sign the message_bytes by alice
    let sig = await alice.signMessage(message_bytes);

    //Switch to charlie
    let dTokenCharlie = dTokenOwner.connect(charlie);
    await dTokenCharlie.transferPreSigned(sig, to, amount, fee, nonce);

    // After transaction, get the balance of alice, bob, charlie
    let aliceBalance = await dTokenOwner.balanceOf(alice.address);
    let bobBalance = await dTokenOwner.balanceOf(bob.address);
    let charlieBalance = await dTokenOwner.balanceOf(charlie.address);

    //alice balance should be propsInWallet - (amount + fee) = 4989
    expect(Number(aliceBalance)).to.equal(oldAliceBalance - (amount + fee));

    // Bob balance should be amount = 10
    expect(Number(bobBalance)).to.equal(amount);

    // Charlie balance should be fee = 1
    expect(Number(charlieBalance)).to.equal(fee);
  })

  it('Alice approves Bob to spend 100 tokens on behalf of Alice (fee=1)', async () => {

    //Get balance before transaction
    const oldAliceBalance = await dTokenOwner.balanceOf(alice.address);
    const oldCharlieBalance = await dTokenOwner.balanceOf(charlie.address);

    // nonce = await web3.eth.getTransactionCount(alice.address);
    let nonce = 1;
    let allowance = 100;
    let fee = 1;
    let components;

    components = [
      // /* "79250dcf": getApprovePreSignedHash(address,address,uint256,uint256,uint256) */
      Buffer.from('79250dcf', 'hex'),
      formattedAddress(dTokenOwner.address),
      formattedAddress(bob.address),
      formattedInt(allowance),
      formattedInt(fee),
      formattedInt(nonce),
    ];

    let messageHash = hashedTightPacked(components);
    let message_bytes = ethers.utils.arrayify(messageHash);

    // Sign the message_bytes by alice
    let sig = await alice.signMessage(message_bytes);

    //Switch to charlie
    let dTokenCharlie = dTokenOwner.connect(charlie);
    await dTokenCharlie.approvePreSigned(sig, bob.address, allowance, fee, nonce);

    // After transaction, get the balance of alice, bob, charlie
    let newAliceBalance = await dTokenOwner.balanceOf(alice.address);
    let newBobBalance = await dTokenOwner.balanceOf(bob.address);
    let newCharlieBalance = await dTokenOwner.balanceOf(charlie.address);

    // Bob balance should be amount = 10
    expect(Number(newAliceBalance)).to.equal(Number(oldAliceBalance) - fee);

    // Charlie balance should be fee = 1
    expect(Number(newCharlieBalance)).to.equal(Number(oldCharlieBalance) + fee);

    //Check tha allow bob from alice
    let bobAllowance = await dTokenOwner.allowance(alice.address,bob.address);
    expect(bobAllowance).to.equal(allowance);
  })

  it('Bob tranfer allowed balance from Alice to Charlie (fee=1)', async () => {
    // Transfer 100 tokens from owner to addr1
    await dTokenOwner.transfer(bob.address, 100);

    // //Switch to charlie
    let dTokenAlice = dTokenOwner.connect(alice);
    // Allow bob to transfer 1000 from alice
    await dTokenAlice.approve(bob.address, 1000)

    //Get balance before transaction
    const oldAliceBalance = await dTokenOwner.balanceOf(alice.address);
    const oldBobBalance = await dTokenOwner.balanceOf(bob.address);
    const oldCharlieBalance = await dTokenOwner.balanceOf(charlie.address);

    // nonce = await web3.eth.getTransactionCount(alice.address);
    let nonce = 1;
    let value = 20;
    let fee = 1;
    let components;

    components = [
      // /* "a70c41b4": getTransferFromPreSignedHash(address,address,address,uint256,uint256,uint256) */
      Buffer.from('a70c41b4', 'hex'),
      formattedAddress(dTokenOwner.address),
      formattedAddress(alice.address),
      formattedAddress(charlie.address),
      formattedInt(value),
      formattedInt(fee),
      formattedInt(nonce),
    ];

    let messageHash = hashedTightPacked(components);
    let message_bytes = ethers.utils.arrayify(messageHash);

    // Sign the message_bytes by bob
    let sig = await bob.signMessage(message_bytes);

    //Switch to charlie
    let dTokenCharlie = dTokenOwner.connect(charlie);
    await dTokenCharlie.transferFromPreSigned(sig, alice.address, charlie.address, value, fee, nonce);

    // After transaction, get the balance of alice, bob, charlie
    let newAliceBalance = await dTokenOwner.balanceOf(alice.address);
    let newBobBalance = await dTokenOwner.balanceOf(bob.address);
    let newCharlieBalance = await dTokenOwner.balanceOf(charlie.address);

    // Alice balance should be : oldAliceBalance - value
    expect(Number(newAliceBalance)).to.equal(Number(oldAliceBalance) - value);

    // Bob balance should be : oldBobBalance - fee
    expect(Number(newBobBalance)).to.equal(Number(oldBobBalance) - fee);

    // Charlie balance should be oldCharlieBalance + value + fee
    expect(Number(newCharlieBalance)).to.equal(Number(oldCharlieBalance) + value + fee);
  })

  it('Alice decrease Bob allowance by Charlie (fee=1)', async () => {
    // //Switch to charlie
    const dTokenAlice = dTokenOwner.connect(alice);
    // Allow bob to transfer 1000 from alice
    await dTokenAlice.approve(bob.address, 1000)

    //Get allowance before transaction
    const oldBobAllowance = await dTokenOwner.allowance(alice.address,bob.address);

    //Get balance before transaction
    const oldCharlieBalance = await dTokenOwner.balanceOf(charlie.address);

    // nonce = await web3.eth.getTransactionCount(alice.address);
    let nonce = 1;
    let decreaseValue = 100;
    let fee = 1;
    let components;

    components = [
      // /* "5229c56f": getDecreaseAllowancePreSignedHash(address,address,uint256,uint256,uint256) */
      Buffer.from('5229c56f', 'hex'),
      formattedAddress(dTokenOwner.address),
      formattedAddress(bob.address),
      formattedInt(decreaseValue),
      formattedInt(fee),
      formattedInt(nonce),
    ];

    let messageHash = hashedTightPacked(components);
    let message_bytes = ethers.utils.arrayify(messageHash);

    // Sign the message_bytes by alice
    let sig = await alice.signMessage(message_bytes);

    //Switch to charlie
    let dTokenCharlie = dTokenOwner.connect(charlie);
    await dTokenCharlie.decreaseAllowancePreSigned(sig, bob.address, decreaseValue, fee, nonce);

    // After transaction, get the allowance of bob
    let newBobAllowance = await dTokenOwner.allowance(alice.address,bob.address);

    // Bob balance should be amount = 10
    expect(Number(newBobAllowance)).to.equal(Number(oldBobAllowance) - decreaseValue);

    // Charlie balance should be oldCharlieBalance + fee
    expect(Number(newCharlieBalance)).to.equal(Number(oldCharlieBalance) + fee);

  })
})
