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

describe('AlToken contract', function () {
  let multiSigWallet;
  let multiSigWalletArtifact;
  let transmuterArtifact;
  let daiToken;
  let daiTokenUser2;
  let alToken;
  let alchemist;
  let tokenArtifact;
  let yearnControllerMock;
  let yearnVaultMock;
  let yearnVaultAdapter;
  let transmuter;
  let godUser;
  let user1;
  let user2;
  let user3;
  let addressType;
  let uintType;


  beforeEach(async function () {
    [godUser, user1, user2, user3] = await ethers.getSigners();

    addressType = ['address'];

    uintType = ['uint256'];

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

    // Mint for user2 && user3
    await daiToken.mint(user2.address,1000);
    await daiToken.mint(user3.address,1000);

    // Deploy AlToken
    let alTokenFactory = await ethers.getContractFactory('AlToken');
    alToken = await alTokenFactory.deploy();
    await alToken.deployed();

    // Deploy Alchemist
    let alchemistFactory = await ethers.getContractFactory('Alchemist');
    alchemist = await alchemistFactory.deploy(daiToken.address, alToken.address, multiSigWallet.address, godUser.address);
    await alchemist.deployed();

    // Set goduser into the WhiteList
    await alToken.setWhitelist(alchemist.address, true);

    // Set ceiling for user2 and alchemist
    await alToken.setCeiling(alchemist.address,100000);

    // user2 Set approve for alchmist
    daiTokenUser2 = daiToken.connect(user2);
    await daiTokenUser2.approve(alchemist.address,1000);

    // user3 Set approve for alchmist
    let daiTokenUser3 = daiToken.connect(user3);
    await daiTokenUser3.approve(alchemist.address,1000);

    multiSigWalletArtifact = await hre.artifacts.readArtifact("Alchemist");

    // Deploy Transmuter
    let transmuterFactory = await ethers.getContractFactory('Transmuter');
    transmuter = await transmuterFactory.deploy(alToken.address, daiToken.address, multiSigWallet.address);
    await transmuter.deployed();

    // Deploy yearnControllerMock
    let yearnControllerMockFactory = await ethers.getContractFactory("YearnControllerMock");
    yearnControllerMock = await yearnControllerMockFactory.deploy();
    await yearnControllerMock.deployed();

    // Deploy YearnVaultMock
    let yearnVaultMockFactory = await ethers.getContractFactory("YearnVaultMock");
    yearnVaultMock = await yearnVaultMockFactory.deploy(daiToken.address,yearnControllerMock.address);
    await yearnVaultMock.deployed();

    // Deploy YearnVaultMock
    let yearnVaultAdapterFactory = await ethers.getContractFactory("YearnVaultAdapter");
    yearnVaultAdapter = await yearnVaultAdapterFactory.deploy(yearnVaultMock.address,alchemist.address);
    await yearnVaultAdapter.deployed();

    // Set rewards
    let payload = getPayLoad(multiSigWalletArtifact.abi,"setRewards",[user2.address],addressType); 
    let submitTransaction = await multiSigWallet.submitTransaction(alchemist.address, 0, payload);
    await submitTransaction.wait();

    // SetTransmuter
    payload = getPayLoad(multiSigWalletArtifact.abi,"setTransmuter",[transmuter.address],addressType);
    submitTransaction = await multiSigWallet.submitTransaction(alchemist.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();
    
    // initialize
    payload = getPayLoad(multiSigWalletArtifact.abi,"initialize",[yearnVaultAdapter.address],addressType);
    submitTransaction = await multiSigWallet.submitTransaction(alchemist.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    expect(await alchemist.initialized()).to.be.true;

    // setFlushActivator
    payload = getPayLoad(multiSigWalletArtifact.abi,"setFlushActivator",[10],uintType);
    submitTransaction = await multiSigWallet.submitTransaction(alchemist.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    expect(await alchemist.initialized()).to.be.true;

    // Set whiteList for Transmuter
    transmuterArtifact = await hre.artifacts.readArtifact("Transmuter");
    let setWhitelistParameterType = ['address','bool'];
    let setWhitelistParameterValue = [alchemist.address,true];
    payload = getPayLoad(transmuterArtifact.abi,"setWhitelist",setWhitelistParameterValue,setWhitelistParameterType);
    submitTransaction = await multiSigWallet.submitTransaction(transmuter.address, 0, payload);
    transactionReceipt = await submitTransaction.wait();

    expect(await transmuter.whiteList(alchemist.address)).to.be.true;

  });

  it('SetPendingGovernance', async function () {
    // Get payload
    const payload = getPayLoad(multiSigWalletArtifact.abi,"setPendingGovernance",[user2.address],addressType);

    // Execute 
    const submitTransaction = await multiSigWallet.submitTransaction(alchemist.address, 0, payload);
    const transactionReceipt = await submitTransaction.wait();

    // Chec result 
    expect(await alchemist.pendingGovernance()).to.equal(user2.address);
  }); 

  it('AcceptGovernance', async function () {
    // Get payload
    const payload = getPayLoad(multiSigWalletArtifact.abi,"setPendingGovernance",[user2.address],addressType);

    // Execute 
    const submitTransaction = await multiSigWallet.submitTransaction(alchemist.address, 0, payload);
    const transactionReceipt = await submitTransaction.wait();

    // Call the  acceptGovernance
    let alchemistUser2 = alchemist.connect(user2);
    await alchemistUser2.acceptGovernance();

    // Check result
    expect(await alchemist.governance()).to.equal(user2.address);
  });

  it('VaultCount', async function () {
    // Check result
    expect(await alchemist.vaultCount()).to.equal(1);
 
  }); 

  it('GetVaultTotalDeposited', async function () {
    // Check result
    expect(await alchemist.getVaultTotalDeposited(0)).to.equal(0);

  });  

  it('Deposit && Withdraw && Mint', async function () {
    let alchemistUser2 = alchemist.connect(user2);
    await alchemistUser2.deposit(100);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("100");

    // With draw
    await alchemistUser2.withdraw(50);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("50");
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("950");

    // Mint
    await alchemistUser2.mint(25);

    // Check mint result
    expect((await alToken.balanceOf(user2.address)).toString()).to.equal("25");
  });  
  

  it('Repay', async function () {
    let alchemistUser2 = alchemist.connect(user2);
    await alchemistUser2.deposit(100);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("100");

    // With draw
    await alchemistUser2.withdraw(50);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("50");
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("950");

    // Mint
    await alchemistUser2.mint(25);

    // Check mint result
    expect((await alToken.balanceOf(user2.address)).toString()).to.equal("25");

    // Set approve for alchemist
    let alTokenUser2 = alToken.connect(user2);
    await alTokenUser2.approve(alchemist.address,10000);

    await alchemistUser2.repay(10,15);

    // Check repay result
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("940");
    expect((await alToken.balanceOf(user2.address)).toString()).to.equal("10");
  });  

  it('Liquidate', async function () {
    let alchemistUser2 = alchemist.connect(user2);
    await alchemistUser2.deposit(100);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("100");

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("100");
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("900");

    // Mint
    await alchemistUser2.mint(25);

    // Check mint result
    expect((await alToken.balanceOf(user2.address)).toString()).to.equal("25");

    // Set approve for alchemist
    let alTokenUser2 = alToken.connect(user2);
    await alTokenUser2.approve(alchemist.address,10000);

    await alchemistUser2.liquidate(25);

    // Check repay result
    expect((await alToken.balanceOf(user2.address)).toString()).to.equal("25");
    expect(await alchemist.getCdpTotalDebt(user2.address)).to.equal(0);
    expect(await alchemist.getCdpTotalDeposited(user2.address)).to.equal(75);
  }); 


  it('Harvest', async function () {
    let alchemistUser2 = alchemist.connect(user2);
    await alchemistUser2.deposit(100);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("100");
    expect((await daiToken.balanceOf(user2.address)).toString()).to.equal("900");

    // Mint
    await alchemistUser2.mint(50);

    // Mint for YearnVaultAdapter as profit
    await daiToken.mint(yearnVaultAdapter.address,50);

    // YearnVaultAdapter do the deposite
    await yearnVaultAdapter.deposit(50);

    // Check Balance
    expect((await daiToken.balanceOf(yearnVaultMock.address)).toString()).to.equal("150");

    // Check the fToken hasMinted
    expect((await alToken.hasMinted(alchemist.address))).to.equal(50);

    // Do alchemist harvest
    await  alchemist.harvest(0);

    // Check harvest result
    expect((await daiToken.balanceOf(transmuter.address)).toString()).to.equal("50"); 

    // Check the fToken hasMinted
    expect((await alToken.hasMinted(alchemist.address))).to.equal(0);
  
  }); 

});
