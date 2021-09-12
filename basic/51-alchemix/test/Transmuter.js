const { expect } = require('chai');
const hre = require('hardhat');
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

describe('Transmuter contract', function () {
  let multiSigWallet;
  let transmuterArtifact;
  let daiToken;
  let alToken;
  let transmuter;
  let godUser;
  let user1;
  let user2;
  let user3;


  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    // Deploy MultiSigWallet
    let multiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');

    // Config parameters
    let owners = [godUser.address, user1.address];
    let required = 1;

    multiSigWallet = await multiSigWalletFactory.deploy(owners, required);
    await multiSigWallet.deployed();

    // Deploy daiToken
    let daiTokenFactory = await ethers.getContractFactory('ERC20Mock');
    daiToken = await daiTokenFactory.deploy('Dai', 'Dai', 18);
    await daiToken.deployed();

    // Mint for godUser 
    await daiToken.mint(godUser.address,1000);
    await daiToken.mint(user2.address,1000);

    // Deploy AlToken
    let alTokenFactory = await ethers.getContractFactory('AlToken');
    alToken = await alTokenFactory.deploy();
    await alToken.deployed();

    // Set goduser into the WhiteList
    await alToken.setWhitelist(godUser.address, true);

    // Set ceiling for user2 and alchemist
    await alToken.setCeiling(godUser.address,100000);
    await alToken.setCeiling(user2.address,100000);

    // Mint alToken for godUser
    await alToken.mint(godUser.address,1000);
    await alToken.mint(user2.address,1000);

    // Deploy Transmuter
    let transmuterFactory = await ethers.getContractFactory('Transmuter');
    transmuter = await transmuterFactory.deploy(alToken.address, daiToken.address, multiSigWallet.address);
    await transmuter.deployed();

    // Approve transmuter to transfer for godUser
    await daiToken.approve(transmuter.address,1000);
    let daiTokenUser2 = daiToken.connect(user2);
    await daiTokenUser2.approve(transmuter.address,1000);

    // Approve transmuter to transfer for godUser
    await alToken.approve(transmuter.address,1000);
    let alTokenUser2 = alToken.connect(user2);
    await alTokenUser2.approve(transmuter.address,1000);

    // Set whiteList for Transmuter
    transmuterArtifact = await hre.artifacts.readArtifact("Transmuter");
    let setWhitelistParameterType = ['address','bool'];
    let setWhitelistParameterValue = [godUser.address,true];
    payload = getPayLoad(transmuterArtifact.abi,"setWhitelist",setWhitelistParameterValue,setWhitelistParameterType);
    submitTransaction = await multiSigWallet.submitTransaction(transmuter.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    expect(await transmuter.whiteList(godUser.address)).to.be.true;

    // Set whiteList for Transmuter
    let transmutationPeriodType = ['uint256'];
    let transmutationPeriodTypeValue = [0];
    payload = getPayLoad(transmuterArtifact.abi,"setTransmutationPeriod",transmutationPeriodTypeValue,transmutationPeriodType);
    submitTransaction = await multiSigWallet.submitTransaction(transmuter.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    expect(await transmuter.TRANSMUTATION_PERIOD()).to.equal(0);

  });

  it('Distribute', async function () {
    await transmuter.distribute(godUser.address,100);

    // Check buffered
    expect(await transmuter.buffer()).to.equal(100); 

  }); 

  it('Stake && Unstake', async function () {
    let transmuterUser2 = transmuter.connect(user2);
    await transmuterUser2.stake(100);

    // God User to distribute
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("0");
    await transmuter.distribute(godUser.address,100);

    // First User2 to stake
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("0");
    transmuterUser2 = transmuter.connect(user2);
    
    expect((await transmuter.dividendsOwing(user2.address)).toString()).to.equal("0");
    //await transmuterUser2.stake(100);
    await transmuter.distribute(godUser.address,100);

    expect((await transmuter.dividendsOwing(user2.address)).toString()).to.equal("100");
    expect((await transmuter.pointMultiplier()).toString()).to.equal("10000000000000000000");
    expect((await transmuter.totalSupplyAltokens()).toString()).to.equal("100");
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("100");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("10000000000000000000");
    expect((await transmuter.tokensInBucket(user2.address)).toString()).to.equal("0");

    // Unstake
    await transmuterUser2.unstake(100);

    // Check result
    expect((await transmuter.totalSupplyAltokens()).toString()).to.equal("0");
    expect((await transmuter.depositedAlTokens(user2.address)).toString()).to.equal("0");

  });  

  it('Transmute && Claim', async function () {
    let transmuterUser2 = transmuter.connect(user2);
    await transmuterUser2.stake(100);

    // God User to distribute
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("0");
    await transmuter.distribute(godUser.address,100);

    // First User2 to stake
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("0");
    expect((await transmuter.dividendsOwing(user2.address)).toString()).to.equal("0");

    await transmuterUser2.stake(100);

    expect((await transmuter.dividendsOwing(user2.address)).toString()).to.equal("0");
    expect((await transmuter.pointMultiplier()).toString()).to.equal("10000000000000000000");
    expect((await transmuter.totalSupplyAltokens()).toString()).to.equal("200");
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("10000000000000000000");
    expect((await transmuter.tokensInBucket(user2.address)).toString()).to.equal("100");

    // Transmute
    await transmuterUser2.transmute();

    // Check result
    expect((await transmuter.realisedTokens(user2.address)).toString()).to.equal("100");

    // claim
    await transmuterUser2.claim();

    // Check result
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("1100");

  });  

  it('ForceTransmute', async function () {
    let transmuterUser2 = transmuter.connect(user2);
    await transmuterUser2.stake(100);

    // God User to distribute
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("0");
    await transmuter.distribute(godUser.address,200);

    // First User2 to stake
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("0");
    expect((await transmuter.dividendsOwing(user2.address)).toString()).to.equal("0");

    await transmuterUser2.stake(10);

    expect((await transmuter.dividendsOwing(user2.address)).toString()).to.equal("0");
    expect((await transmuter.pointMultiplier()).toString()).to.equal("10000000000000000000");
    expect((await transmuter.totalSupplyAltokens()).toString()).to.equal("110");
    expect((await transmuter.unclaimedDividends()).toString()).to.equal("0");
    expect((await transmuter.totalDividendPoints()).toString()).to.equal("20000000000000000000");
    expect((await transmuter.tokensInBucket(user2.address)).toString()).to.equal("200");

    // Transmute
    await transmuter.forceTransmute(user2.address);

    // Check result
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("1110");

  }); 


});
