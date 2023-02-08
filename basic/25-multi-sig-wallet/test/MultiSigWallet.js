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
    console.log("Alice address: %s\n Bob address: %s\n David address: %s\n",
        Alice.address,Bob.address,David.address);

    //部署多签合约`MultiSigWallet.sol`
    const MultiSigWalletContractFactory = await ethers.getContractFactory("MultiSigWallet");
    const multiSigWalletContract = await MultiSigWalletContractFactory.deploy([Alice.address,Bob.address,David.address],2);
    await multiSigWalletContract.deployed();
    console.log("MultiSigWallet Contract address: ",multiSigWalletContract.address);

    //部署交易合约`Hello.sol`,该合约的交易只能由上面的那个合约触发
    const HelloContractFactory = await ethers.getContractFactory("Hello");
    const helloContract = await HelloContractFactory.deploy();
    await helloContract.deployed();
    console.log("Hello Contract address: ",helloContract.address);

    //在多签钱包添加一笔交易
    const tokenArtifact = await hre.artifacts.readArtifact("Hello");
    const payload = getPayLoad(tokenArtifact.abi,"set",233);
    const submitTransaction = await multiSigWalletContract.submitTransaction(helloContract.address, 0, payload);
    const transactionReceipt = await submitTransaction.wait();

    // 检查结果（不通过） 当前有1人确认
    expect((await helloContract.balance()).toString()).not.to.equal("233");

    //当前交易数量是 1
    const transactionCount = await multiSigWalletContract.transactionCount();
    console.log("transaction count: ",transactionCount);
    expect(transactionCount.toString()).to.equal("1");

    const transactionId = await transactionReceipt.events[0].args.transactionId
    console.log("transaction id: ",transactionId);

    //当前已确认人数是 1
    const confirmations1 = await multiSigWalletContract.getConfirmations(transactionId)
    console.log("confirmations number: ",confirmations1.length);
    expect(confirmations1.length.toString()).to.equal("1");

    //最小需要确认人数是 2
    const requiredCount = await multiSigWalletContract.required()
    console.log("required count: ", requiredCount);
    expect(requiredCount.toString()).to.equal("2");

    //可确认交易人数是 3
    const owners = await multiSigWalletContract.getOwners()
    console.log("owners count: ", owners.length);
    expect(owners.length.toString()).to.equal("3");

    //其他参与者确认
    await multiSigWalletContract.connect(Bob).confirmTransaction(transactionId);

    //当前已确认人数是 2
    const confirmations2 = await multiSigWalletContract.connect(Bob).getConfirmations(transactionId)
    console.log("confirmations number: ",confirmations2.length);
    expect(confirmations2.length.toString()).to.equal("2");

    // 再次检查结果（通过） 当前有2人确认
    expect((await helloContract.balance()).toString()).to.equal("233");
  });
});

