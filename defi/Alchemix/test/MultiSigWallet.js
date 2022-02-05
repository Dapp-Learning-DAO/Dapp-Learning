const { expect } = require("chai");



function getPayLoad(contractABI,functionName,param){
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
    const codeOfParam =  abiCoder.encode(['uint256'],[param])
    
    
    //payload
    const payload = functionSigHash + codeOfParam.substring(2,codeOfParam.length);
    return payload;
  }
}

describe("MultiSigWallet test",function(){
  it("test function of MultiSigWallet.sol",async function(){
    //测试账号数组
    const [Alice,Bob,David] = await ethers.getSigners();
    
    //部署多签合约`MultiSigWallet.sol`
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const multiSigWallet = await MultiSigWallet.deploy([Alice.address,Bob.address,David.address],1);
    await multiSigWallet.deployed();
    
    //部署交易合约`Hello.sol`,该合约的交易只能由上面的那个合约触发
    const Hello = await ethers.getContractFactory("Hello");
    const hello = await Hello.deploy();
    await hello.deployed();
    
    
    //在多签钱包添加一笔交易
    const tokenArtifact = await hre.artifacts.readArtifact("Hello");
    const payload = getPayLoad(tokenArtifact.abi,"set",233);
    const submitTransaction = await multiSigWallet.submitTransaction(hello.address, 0, payload);
    const transactionReceipt = await submitTransaction.wait();

    // Check the result
    expect((await hello.balance()).toString()).to.equal("233");
    //console.log("transactionReceipt:",transactionReceipt);
    
    
    // await multiSigWallet.queryFilter("Submission" , transactionReceipt.blockNumber ,transactionReceipt.blockNumber)
    // .then(e => console.log(e)).catch(err =>console.log(err));
    
    
    //其他参与者同意
    // await multiSigWallet.connect(Bob).confirmTransaction(Bob.address, 50);
    
    
    
    
    // console.log("abi of hello:",tokenArtifact.abi);
    
    // const data = getPayLoad();
    
  });
});

