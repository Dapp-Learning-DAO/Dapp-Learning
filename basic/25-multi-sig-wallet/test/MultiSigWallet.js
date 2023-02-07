const { expect } = require("chai");



function getPayLoad(contractABI,functionName,param){
  for(let i=0;i<contractABI.length;i++){
    const functionABI = contractABI[i];
    if (functionName !== functionABI.name) {
      continue;
    }

    //get sigHash of function
    const contractInterface = new ethers.utils.Interface(contractABI);
    const functionSigHash = contractInterface.getSighash(functionName);
    console.log("sign of method:%s is %s",functionName,functionSigHash);

    //encode param
    const abiCoder =new ethers.utils.AbiCoder()
    const codeOfParam =  abiCoder.encode(['uint256'],[param])
    console.log("codeOfParam:",codeOfParam);


    //payload
    const payload = functionSigHash + codeOfParam.substring(2,codeOfParam.length);
    console.log("payload:",functionName,payload);
    return payload;
  }
}

describe("MultiSigWallet test",function(){
  it("test function of MultiSigWallet.sol",async function(){
    //测试账号数组
    const [Alice,Bob,David] = await ethers.getSigners();

    //部署多签合约`MultiSigWallet.sol`
    const MultiSigWalletContractFactory = await ethers.getContractFactory("MultiSigWallet");
    const multiSigWallet = await MultiSigWalletContractFactory.deploy([Alice.address,Bob.address,David.address],2);
    await multiSigWallet.deployed();
    console.log("address of multiSigWallet:",multiSigWallet.address);

    //部署交易合约`Hello.sol`,该合约的交易只能由上面的那个合约触发
    const HelloContractFactory = await ethers.getContractFactory("Hello");
    const hello = await HelloContractFactory.deploy();
    await hello.deployed();
    console.log("address of hello:",hello.address);

    //在多签钱包添加一笔交易
    const tokenArtifact = await hre.artifacts.readArtifact("Hello");
    const payload = getPayLoad(tokenArtifact.abi,"set",233);
    const submitTransaction = await multiSigWallet.submitTransaction(hello.address, 0, payload);
    const transactionReceipt = await submitTransaction.wait();

    // 检查结果（不通过）
    expect((await hello.balance()).toString()).not.to.equal("233");

    //其他参与者同意
    const transactionCount = await multiSigWallet.transactionCount();
    console.debug("transaction count:",transactionCount);

    await multiSigWallet.connect(Bob).confirmTransaction(transactionReceipt.events[0].args.transactionId);

    // 再次检查结果
    expect((await hello.balance()).toString()).to.equal("233");
  });
});

