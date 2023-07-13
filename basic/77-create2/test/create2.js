const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { keccak256 } = require("@ethersproject/keccak256");
// import { toUtf8Bytes } from "@ethersproject/strings";

//NOTE: This demo is using ethers-v6.

describe("CREATE2", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const ContractFactoryFactory = await ethers.getContractFactory("ContractFactory");
    const contractFactory = await ContractFactoryFactory.deploy();
    console.log("Contract Factory Deployed To: " + contractFactory.target);
    return {contractFactory};
  }

  it("should predict and deploy the contract with Create2", async function(){
    const [signer] = await ethers.getSigners();
    const {contractFactory} = await loadFixture(deployFixture);

    //Get InitCode. It is the bytecode + args(in this case the uint256 value "0xabcd")
    const TargetFactory = await ethers.getContractFactory("Target", signer);
    const {data: initCode} = await TargetFactory.getDeployTransaction(0xabcd);

    //Prepare salt
    const salt = ethers.zeroPadValue("0x1234", 32);
    //Predict address
    // const byteArray = ethers.getBytes(initCode);
    const predictedAddress  = await contractFactory.computeAddress(initCode, salt);

    //Deploy the contract
    const tx  = await contractFactory.deploy(initCode, salt);
    const receipt = await tx.wait();
    const actualAddress = receipt.logs[0].args[0];
    
    expect(predictedAddress).to.be.equal(actualAddress);

  });

  it("should deploy to an address with previous balance successfully", async function(){
    const [signer] = await ethers.getSigners();
    const {contractFactory} = await loadFixture(deployFixture);

    //Get InitCode. It is the bytecode + args(in this case the uint256 value "0xabcd")
    const TargetFactory = await ethers.getContractFactory("Target", signer);
    const {data: initCode} = await TargetFactory.getDeployTransaction(0xabcd);

    //Prepare salt
    const salt = ethers.zeroPadValue("0x1234", 32);
    //Predict address
    const predictedAddress  = await contractFactory.computeAddress(initCode, salt);

    //Send money
    const fundTx = {to: predictedAddress, value: ethers.parseEther('0.01')};
    await (await signer.sendTransaction(fundTx)).wait();
    const beforeBalance = await ethers.provider.getBalance(predictedAddress);
    console.log(`${predictedAddress} has balance ${beforeBalance} before deployment`);
    //Deploy the contract
    const tx  = await contractFactory.deploy(initCode, salt);
    const receipt = await tx.wait();
    const actualAddress = receipt.logs[0].args[0];
    expect(predictedAddress).to.be.equal(actualAddress);
    const afterBalance = await ethers.provider.getBalance(actualAddress);

    expect(afterBalance).to.be.equal(beforeBalance);
  });
});
