const { EntryPoint__factory } = require("@account-abstraction/contracts");
const { ethers } = require("hardhat");
const {DeterministicDeployer} = require('@account-abstraction/sdk');
const {MultiSigAccountAPI, getAAProvider} = require("../src/multi_sig_account_api");
//Please run this with --network localhost
async function main(){    
    const [signer1, signer2, bundler] = await ethers.getSigners();
    // entryPointContract: new ethers.Contract("0x1306b01bC3e4AD202612D3843387e94737673F53", EntryPoint__factory.abi),
    const entryPointContract = await getEntryPoint("0x1306b01bC3e4AD202612D3843387e94737673F53");
    const threshold = 2;
    const bundlerUrl= "http://localhost:3000/rpc"
    const targetContract = await getTargetContract();
    //1. deploy an account
    console.log('start deploying aa account');
    const demoAccountContract = await deploy_account([signer1, signer2] , entryPointContract.address, threshold);
    //2. Fund the account to pay for gas
    console.log('start funding aa account');
    await fund_aa(entryPointContract, demoAccountContract.address, signer2);
    //3. Prepare aa provider to interact with bundler.
    const aaProvider = await getAAProvider(entryPointContract.address, demoAccountContract.address, bundlerUrl, ethers.provider, signer1, signer2);
    //4. simuate validation and execution
    console.log('start simulate');
    await simulateChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider, bundler);
    //5. execute "changeThreshold" function in our aa account
    console.log('start send changeThreshold');
    await sendChangeThreshold(demoAccountContract, threshold, entryPointContract, aaProvider);
    //6. execute "setVal" function on target contract throught "execute" function in our aa account
    console.log('start send SetValToTargetContract');
    await sendSetValToTargetContract(targetContract, 666, 2000, aaProvider);
    
}


async function deploy_account(signers, entryPointAddress, threshold) {
    //1. Deploy 
    const DemoAccountFactory = await ethers.getContractFactory("DemoAccount", signers[0]);
    const demoAccountContract = await DemoAccountFactory.deploy(
        entryPointAddress, 
        threshold, 
        signers[0].address);
    await demoAccountContract.deployed();

    //2. Set signers to verify signature
    for (const signer of signers){
        await (await (demoAccountContract.setSigner(signer.address, true))).wait();
    }
    
    //3. Fund the account to transfer eth(this is not used to pay for gas)
    const tx = {to: demoAccountContract.address, value: ethers.utils.parseEther("1.0")};
    await (await signers[0].sendTransaction(tx)).wait();
    console.log(`Deployed to ${demoAccountContract.address}`);
    return demoAccountContract
}


async function fund_aa(entryPointContract, accountAddress, funderSigner) {
    const fundTx = await entryPointContract.connect(funderSigner).depositTo(accountAddress, {value: ethers.utils.parseEther("0.5")});
    await fundTx.wait();
    console.log('fund complete')
    const balance = await entryPointContract.connect(funderSigner).balanceOf(accountAddress);
    console.log(`account ${accountAddress} now has ${ethers.utils.formatEther(balance)} ether`)
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

