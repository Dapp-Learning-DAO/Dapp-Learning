const { ethers } = require("hardhat");//not ethers


async function main(){    
    //Check is factory deployed
    const factoryAddress =await  ensure2470FactoryDeployed();

    //Pre calculate contract address
    var initCode = "0x608060405234801561001057600080fd5b506040516101b33803806101b38339818101604052810190610032919061007a565b80600081905550506100a7565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b91505092915050565b60fe806100b56000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063371303c014602d575b600080fd5b60336035565b005b6000808154809291906045906085565b9190505550565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000819050919050565b6000608e82607b565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820360bd5760bc604c565b5b60018201905091905056fea264697066735822122004ae84a028bac75deaaa2f46f118a3215e7c7c999144352edcf883f28685d23864736f6c63430008110033000000000000000000000000000000000000000000000000000000000000000b";
    const salt = ethers.utils.hexZeroPad(0xabcd, 32);
    const address = "0x" + ethers.utils.keccak256(ethers.utils.hexConcat([
        0xff,//header
        factoryAddress,//sender
        salt,//salt
        ethers.utils.keccak256(initCode) //initCodeHash
    ])).slice(-40);
    console.log('Precalculated address '+address);
    
    //judge if it exists
    var deployedCode = await ethers.provider.getCode(address);
    if (deployedCode && deployedCode.length > 2) return;
    
    //deploy it
    const deployTx = {to: factoryAddress, data: ethers.utils.hexConcat([
        salt,
        initCode
    ])}
    const receipt = await (await ethers.provider.getSigner().sendTransaction(deployTx)).wait();
    var deployedCode = await ethers.provider.getCode(address);
    console.log("deployed:"+deployedCode);
}

async function ensure2470FactoryDeployed() {
    //EIP-2470 defined parameters
    const factoryAddress = "0x4e59b44847b379578588920ca78fbf26c0b4956c";
    const oneTimeAccount = "0x3fab184622dc19b6109349b94811493bf2a45362";
    const fundingEther = "0.0247";
    const deploymentTx = "0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222";
        
    const factoryCode = await ethers.provider.getCode(factoryAddress);
    if (factoryCode && factoryCode.length > 2) {
        return factoryAddress;
    }

    //Fund oneTimeAccount to let it pay for gas
    const fundTx = {to: oneTimeAccount, value: ethers.utils.parseEther(fundingEther)};
    await (await ethers.provider.getSigner().sendTransaction(fundTx)).wait();
    console.log('fund one time address complete');

    //Deploy singleton factory via oneTimeAccount 
    const receipt = await (await ethers.provider.sendTransaction(deploymentTx)).wait();

    return factoryAddress;
}



try{
    main();
} catch(e){
    console.log(e);
}