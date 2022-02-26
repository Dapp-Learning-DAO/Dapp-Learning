const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

function getPayLoad(contractABI,functionName,param,type){
  for(let i=0;i<contractABI.length;i++){
    const functionABI = contractABI[i];
    if (functionName != functionABI.name) {
      continue;
    }
    
    //get sigHash of function
    const interface = new ethers.utils.Interface(contractABI);
    const functionSigHash = interface.getSighash(functionName);


    //encode param
    const abiCoder =new ethers.utils.AbiCoder()
    const codeOfParam =  abiCoder.encode(type,param)
    
    
    //payload
    const payload = functionSigHash + codeOfParam.substring(2,codeOfParam.length);
    return payload;
  }
}

describe("StakingPools contract", function () {
  let stakingPools;
  let daoToken;
  let multiSigWallet;
  let multiSigWalletArtifact;
  let xToken;
  let uniswapToken;
  let godUser;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy daoToken
    let daoTokenFactory = await ethers.getContractFactory('ERC20Mock');
    daoToken = await daoTokenFactory.deploy('Dai', 'Dai', 18);
    await daoToken.deployed();

    // Deploy MultiSigWallet
    let multiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');

    // Config parameters
    let owners = [godUser.address, user1.address];
    let required = 1;

    multiSigWallet = await multiSigWalletFactory.deploy(owners, required);
    await multiSigWallet.deployed();

    // Deploy StakingPools
    let stakingPoolsFactory = await ethers.getContractFactory("StakingPools");
    stakingPools = await stakingPoolsFactory.deploy(daoToken.address,multiSigWallet.address);
    await stakingPools.deployed();
    
    multiSigWalletArtifact = await hre.artifacts.readArtifact("StakingPools");

    // CreatePool
    // Deploy xToken
    let xTokenFactory = await ethers.getContractFactory('ERC20Mock');
    xToken = await xTokenFactory.deploy('Dai', 'Dai', 18);
    await xToken.deployed();

    // Mint for godUser && user1
    await xToken.mint(godUser.address,1000);
    await xToken.mint(user1.address,1000);

    // Set approve for stakingPools
    await xToken.approve(stakingPools.address,1000);
    let xTokenUser1 = xToken.connect(user1);
    await xTokenUser1.approve(stakingPools.address,1000);

    // Create payload to create xToken pool
    let payload = getPayLoad(multiSigWalletArtifact.abi,"createPool",[xToken.address],['address']);
    let submitTransaction = await multiSigWallet.submitTransaction(stakingPools.address, 0, payload);
    let transactionReceipt = await submitTransaction.wait();

    // Check result
    expect((await stakingPools.tokenPoolIds(xToken.address))).to.equal(1);

    // Deploy uniswapToken
    let uniswapTokenFactory = await ethers.getContractFactory('ERC20Mock');
    uniswapToken = await uniswapTokenFactory.deploy('Dai', 'Dai', 18);
    await uniswapToken.deployed();

    // Mint for godUser && user1
    await uniswapToken.mint(godUser.address,1000);
    await uniswapToken.mint(user1.address,1000);

    // Set approve for stakingPools
    await uniswapToken.approve(stakingPools.address,1000);
    let uniswapTokenUser1 = uniswapToken.connect(user1);
    await uniswapTokenUser1.approve(stakingPools.address,1000);

    // Create payload to create uniswapToken pool
    payload = getPayLoad(multiSigWalletArtifact.abi,"createPool",[uniswapToken.address],['address']);
    submitTransaction = await multiSigWallet.submitTransaction(stakingPools.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    // Check result
    expect((await stakingPools.tokenPoolIds(uniswapToken.address))).to.equal(2);

    // SetrewardRate
    let rewardRate = 10;

    // Create payload
    payload = getPayLoad(multiSigWalletArtifact.abi,"setRewardRate",[rewardRate],['uint256']);
    submitTransaction = await multiSigWallet.submitTransaction(stakingPools.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    // Check rewardRate
    expect((await stakingPools.rewardRate())).to.equal(10);

    // SetRewardWeights
    let weights = [10,20];

    // Create payload
    payload = getPayLoad(multiSigWalletArtifact.abi,"setRewardWeights",[weights],['uint256[]']);
    submitTransaction = await multiSigWallet.submitTransaction(stakingPools.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    // Check totalRewardWeight
    expect((await stakingPools.totalRewardWeight())).to.equal(30);

  });

  it("Deposit & Withdraw", async function () {
    // godUser go to deposite
    await stakingPools.deposit(1,100);

    // Wait for 10 seconds
    console.log("Please wait 10 seconds")
    let currentTimeStamp = parseInt(new Date().getTime() / 1000);
    let endTimeStamp = currentTimeStamp + 10;
    while (currentTimeStamp <= endTimeStamp) {
      currentTimeStamp = parseInt(new Date().getTime() / 1000);
    }

    // WithDraw
    await stakingPools.withdraw(1,100);

    // Check the amount of daoToken
    expect((await daoToken.balanceOf(godUser.address)).toString()).to.equal("6");
  });  

  
});
