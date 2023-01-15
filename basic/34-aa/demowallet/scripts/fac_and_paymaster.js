const { EntryPoint__factory } = require("@account-abstraction/contracts");
const { ethers } = require("hardhat");
const {DeterministicDeployer, PaymasterAPI} = require('@account-abstraction/sdk');
const {MsigPaymasterAccountAPI, getAAProvider} = require("../src/api/msig_paymaster_api");
const {PaymasterAPINaive} = require("../src/paymaster/paymaster_api_naive");
const {computeAddress} = require("../src/utils/create2");
const {packUserOp} = require("@account-abstraction/utils");
const demoAccountABI = require("../artifacts/contracts/DemoAccount.sol/DemoAccount.json").abi;
const entryPointAbi = require("../artifacts/contracts/EntryPointDbg.sol/EntryPointDbg.json").abi;
//Please run this with --network localhost
async function main(){    
    const [signer1, signer2, bundler] = await ethers.getSigners();
    // entryPointContract: new ethers.Contract("0x1306b01bC3e4AD202612D3843387e94737673F53", EntryPoint__factory.abi),
    const entryPointContract = await getEntryPoint("0x1306b01bC3e4AD202612D3843387e94737673F53");
    const threshold = 2;
    const bundlerUrl= "http://localhost:3000/rpc"
    const targetContract = await getTargetContract();
    //1. prepare factory and paymaster
    const factoryContract = await createAccountFactory(signer1);
    const [senderAddress, senderInitCode, senderSalt] = await computeSenderAddress(factoryContract.address, entryPointContract.address, threshold, [signer1, signer2]);
    const paymasterAddress = await createAndFundPaymaster(entryPointContract, signer1, senderAddress);
    const demoAccountContract = new ethers.Contract(senderAddress, demoAccountABI);
    //2. Prepare aa provider to interact with bundler.
    const facInfo = {
        factoryContract: factoryContract,
        senderInitCode: senderInitCode,
        senderSalt: senderSalt
    };
    
    const aaProvider = await getAAProvider(
        entryPointContract.address, 
        senderAddress, 
        bundlerUrl, 
        ethers.provider, 
        [signer1, signer2],
        facInfo,
        new PaymasterAPINaive(paymasterAddress)
        );

    // //3. simuate validation and execution
    console.log('start simulate');

    // await simulateChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider, bundler);
    //4. execute "changeThreshold" function in our aa account
    console.log('start send changeThreshold');
    await sendChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider);
    //5. execute "setVal" function on target contract throught "execute" function in our aa account
    console.log('start send SetValToTargetContract');
    await sendSetValToTargetContract(targetContract, 666, 2000, aaProvider);
    
}

async function computeSenderAddress(factoryAddress, entryPointAddress, threshold, signers) {
    const signersAddr = [];
    for(signer of signers){
        signersAddr.push(signer.address);
    }
    
    const SenderFactory = await ethers.getContractFactory("DemoAccount");
    const creationCode = SenderFactory.bytecode;
    
    const argsEncoded = ethers.utils.defaultAbiCoder.encode(["address", "uint8", "address", "address[]"], [entryPointAddress, threshold, signersAddr[0], signersAddr]);
    const initCode = ethers.utils.solidityPack(["bytes", "bytes"], [creationCode, argsEncoded]);

    const salt = ethers.utils.hexZeroPad(0x1234, 32);
    const sender =  computeAddress(factoryAddress, initCode, salt);
    console.log(`predicted sender addrss is ${sender}`);
    return [sender, initCode, salt];
}

async function createAccountFactory(signer) {
    const Factory = await ethers.getContractFactory("ERC4337Factory", signer);
    const factoryContract = await Factory.deploy();
    await factoryContract.deployed();

    console.log(`factory deployed to ${factoryContract.address}`);
    return factoryContract;
}

async function createAndFundPaymaster(entryPointContract, signer, senderAddress) {
    //1. 将sender作为构造参数，部署Paymaster
    const Factory = await ethers.getContractFactory("GasPrefundPaymaster", signer);
    const paymasterContract = await Factory.deploy(senderAddress, entryPointContract.address);
    await paymasterContract.deployed();
    console.log(`paymaster deployed to ${paymasterContract.address}`);
    //2. 调用Paymaster，冲入gas启动资金，后续EF会使用这笔资金来付账
    await (await paymasterContract.connect(signer).addDepositForSender({value: ethers.utils.parseEther("5.0")})).wait();
    const paymasterBalance = await entryPointContract.connect(signer).balanceOf(paymasterContract.address);
    console.log(`Fund paymaster complete, now paymaster have ${ethers.utils.formatEther(paymasterBalance)} ether`);
    return paymasterContract.address;
}

async function simulateChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider, bundler){
    //1. We could simulateValidation ourself. But DONT USE IT IN PRODUCTION, it is the bundler's reponsibility.
    const tx = await demoAccountContract.populateTransaction.changeThreshold(threshold);
    var userOperation = await aaProvider.smartAccountAPI.createSignedUserOp({
      target: tx.to ?? '',
      data: tx.data?.toString() ?? '',
      value: tx.value,
      gasLimit: tx.gasLimit
    });
    

    // try{
    //     await (await entryPointContract.connect(bundler).simulateValidation(userOperation)).wait();
    // }
    // catch(e){
    //     //This should have "ValidationResult as error"
    //     console.log(e);
    // }

    // try{
    //     await (await entryPointContract.connect(bundler).simulateHandleOp(userOperation)).wait();
    //     console.log('complete')
    // }
    // catch(e){
    //     //This should have "ExecutionResult as error"
    //     console.log(e);
    // }
}

async function sendChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider){
    const aaSigner = aaProvider.getSigner();
    await (await demoAccountContract.connect(aaSigner).changeThreshold(threshold)).wait();
}

async function sendSetValToTargetContract(targetContract, val, value, aaProvider){
    const aaSigner = aaProvider.getSigner();
    await (await targetContract.connect(aaSigner).setVal(val, {value: value})).wait();

    const newVal = await targetContract.connect(aaProvider).val();
    const balance = await aaProvider.getBalance(targetContract.address);
    console.log(`target contract now has val ${newVal}, balance ${balance}`);
}

async function getEntryPoint(entryPointAddress) {   
    //目前这个版本有bug，但是确实是这么调用的，应该是ABI和实际代码不匹配，导致unrecgonized custom error先注释掉
    const dep = new DeterministicDeployer(ethers.provider);
    const address = await dep.deterministicDeploy(EntryPoint__factory.bytecode);
    console.log(`ep deployed to ${address}`)
    return new ethers.Contract(address, EntryPoint__factory.abi);

    //可以本地调试，解决各种问题
    // const DBG = await ethers.getContractFactory("EntryPointDbg");
    // const ep = await DBG.deploy();
    // await ep.deployed();
    // return ep;
}

async function getTargetContract(){
    const Factory = await ethers.getContractFactory("TargetContract");
    const contract = await Factory.deploy();
    await contract.deployed();
    return contract;
}

try{
    main()
}
catch(e){

    // console.log(e)
}

