const { EntryPoint__factory } = require("@account-abstraction/contracts");
const { ethers } = require("hardhat");
const {DeterministicDeployer, PaymasterAPI} = require('@account-abstraction/sdk');
const {MultiSigAccountAPI, getAAProvider} = require("../src/multi_sig_account_api");
const {computeAddress} = require("../src/utils/create2");

//Please run this with --network localhost
async function main(){    

    const [signer1, signer2, bundler] = await ethers.getSigners();
    // entryPointContract: new ethers.Contract("0x1306b01bC3e4AD202612D3843387e94737673F53", EntryPoint__factory.abi),
    const entryPointContract = await getEntryPoint("0x1306b01bC3e4AD202612D3843387e94737673F53");
    const threshold = 2;
    const bundlerUrl= "http://localhost:3000/rpc"
    const targetContract = await getTargetContract();
    //1. prepare factory and paymaster
    const factoryAddress = await prepareAccountFactory(signer1);
    const senderAddress = await computeSenderAddress(factoryAddress, entryPointContract.address, threshold, signer1.address);
    await preparePaymaster(entryPointContract, signer1, senderAddress);

    
    // //2. Prepare aa provider to interact with bundler.
    // const aaProvider = await getAAProvider(entryPointContract.address, demoAccountContract.address, bundlerUrl, ethers.provider, signer1, signer2);
    // //3. simuate validation and execution
    // console.log('start simulate');
    // await simulateChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider, bundler);
    // //4. execute "changeThreshold" function in our aa account
    // console.log('start send changeThreshold');
    // await sendChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider);
    // //5. execute "setVal" function on target contract throught "execute" function in our aa account
    // console.log('start send SetValToTargetContract');
    // await sendSetValToTargetContract(targetContract, 666, 2000, aaProvider);
    
}

async function computeSenderAddress(factoryAddress, entryPointAddress, threshold, owner) {
    const SenderFactory = await ethers.getContractFactory("DemoAccount");
    const creationCode = SenderFactory.bytecode;
    
    const argsEncoded = ethers.utils.defaultAbiCoder.encode(["address", "uint8", "address"], [entryPointAddress, threshold, owner]);
    const initCode = ethers.utils.solidityPack(["bytes", "bytes"], [creationCode, argsEncoded]);

    const salt = 0x1234;
    return computeAddress(factoryAddress, initCode, salt);
}

async function prepareAccountFactory(signer) {
    const Factory = await ethers.getContractFactory("ERC4337Factory", signer);
    const factoryContract = await Factory.deploy();
    await factoryContract.deployed();

    console.log(`factory deployed to ${factoryContract.address}`);
    return factoryContract.address;
}

async function preparePaymaster(entryPointContract, signer, senderAddress) {
    //1. 将sender作为构造参数，部署Paymaster
    const Factory = await ethers.getContractFactory("GasPrefundPaymaster", signer);
    const paymasterContract = await Factory.deploy(senderAddress, entryPointContract.address);
    await paymasterContract.deployed();
    console.log(`paymaster deployed to ${paymasterContract.address}`);
    //2. 调用Paymaster，冲入gas启动资金，后续EF会使用这笔资金来付账
    await (await paymasterContract.connect(signer).addDepositForSender({value: ethers.utils.parseEther("1.0")})).wait();
    const paymasterBalance = await entryPointContract.connect(signer).balanceOf(paymasterContract.address);
    console.log(`Fund paymaster complete, now paymaster have ${ethers.utils.formatEther(paymasterBalance)} ether`);
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
    console.log(userOperation);
    try{
        await (await entryPointContract.connect(bundler).simulateValidation(userOperation)).wait();
    }
    catch(e){
        //This should have "ValidationResult as error"
        console.log(e);
    }

    try{
        await (await entryPointContract.connect(bundler).simulateHandleOp(userOperation)).wait();
    }
    catch(e){
        //This should have "ExecutionResult as error"
        console.log(e);
    }
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
    //目前这个版本有bug，但是确实是这么调用的，先注释掉
    // const dep = new DeterministicDeployer(ethers.provider);
    // const address = await dep.deterministicDeploy(EntryPoint__factory.bytecode);
    // console.log(`ep deployed to ${address}`)
    // return new ethers.Contract(address, EntryPoint__factory.abi);

    const dep = new DeterministicDeployer(ethers.provider);
    const dbg = await ethers.getContractFactory("EntryPointDbg");
    const address = await dep.deterministicDeploy(EntryPoint__factory.bytecode);//TODO: current
    return new ethers.Contract(address, EntryPoint__factory.abi);
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
    console.log(e)
}

