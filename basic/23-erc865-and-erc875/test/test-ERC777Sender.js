const { expect } = require("chai");

const erc777SenderAddress = require('../Simple777Sender-address.json');
const erc777TokenAddress = require('../Simple777Token-address.json');

describe('ERC777 compatible logic', async () => {
  it('sends from an externally-owned account', async () => {
    const [deployer,alice] = await ethers.getSigners();
  
    // Get the abi of Simple777Sender
    const artifactSimple777Sender = artifacts.readArtifactSync('Simple777Sender');

    // Create contract instance of Simple777Sender
    const erc777SenderContract = new ethers.Contract(
      erc777SenderAddress.contractAddress,
      artifactSimple777Sender.abi,
      alice
    );

    console.log("Do senderFor for Alice");
    const senderInterfaceHash = await erc777SenderContract.TOKENS_SENDER_INTERFACE_HASH();
    await erc777SenderContract.senderFor(alice.address); 

    // Get the abi of IERC1820Registry
    const artifactIERC1820Registry = artifacts.readArtifactSync('IERC1820Registry');

    const ierc1820Registry = '0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24';

    // Create contract instance of Simple777Sender
    const erc1820Contract = new ethers.Contract(
      ierc1820Registry,
      artifactIERC1820Registry.abi,
      alice
    );

    // Set InterfaceImplementer 
    console.log("Set InterfaceImplementer for Alice");
    await erc1820Contract.setInterfaceImplementer(alice.address,senderInterfaceHash,erc777SenderAddress.contractAddress);

    // Get the abi of Simple777Sender
    const artifactSimple777Token = artifacts.readArtifactSync('Simple777Token');

    // Create contract instance of Simple777Sender
    const erc777TokenContract = new ethers.Contract(
      erc777TokenAddress.contractAddress,
      artifactSimple777Token.abi,
      alice
    );

    // Check balance before transfer
    let deployerBalanceBefore = await erc777TokenContract.balanceOf(deployer.address);

    // Do the Transfer
    console.log("Transfer 100 from Alice to Deployer");
    const additionalData = ethers.utils.formatBytes32String("777TestData")
    await erc777TokenContract.send(deployer.address,100,additionalData);
    console.log("Transfer Successfully");

    // Check balance after transfer
    console.log("Check balance after transfer");
    let deployerBalanceAfter = await erc777TokenContract.balanceOf(deployer.address);
    expect(Number(deployerBalanceAfter)).to.equal(Number(deployerBalanceBefore) + 100);
    console.log("Check balance successfully");
  })
})
