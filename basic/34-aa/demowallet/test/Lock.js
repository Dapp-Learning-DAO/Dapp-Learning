const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ERC4337EthersProvider, ERC4337EthersSigner, HttpRpcClient } = require("@account-abstraction/sdk");
const {BaseAccountAPI} = require("@account-abstraction/sdk/dist/src/BaseAccountAPI");
const {EntryPoint__factory} =require("@account-abstraction/contracts");
const abi = require("../artifacts/contracts/DemoAccount.sol/DemoAccount.json").abi;

describe("ContractUnitTest", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, owner2, entryPointSigner] = await ethers.getSigners();

    const DemoAccount_factory = await ethers.getContractFactory("DemoAccount");
    const demoAccount = await DemoAccount_factory.deploy(entryPointSigner.getAddress(), 2, owner.getAddress());
    await demoAccount.deployed();

    await (await demoAccount.connect(owner).setSigner(owner.address, true)).wait();
    await (await demoAccount.connect(owner).setSigner(owner2.address, true)).wait();
    await (await demoAccount.connect(owner).changeThreshold(2)).wait();
    return { demoAccount, entryPointSigner, owner, owner2};
  }

  it("should validate user op successfully ", async function (){
    const { demoAccount, entryPointSigner, owner, owner2} = await deploy();
    var aaProvider = await getAAProvider(entryPointSigner, demoAccount, owner, owner2);
    //Convert transaction to userop
    const tx = await demoAccount.populateTransaction.changeThreshold(1);
    var userOperation = await aaProvider.smartAccountAPI.createSignedUserOp({
      target: tx.to ?? '',
      data: tx.data?.toString() ?? '',
      value: tx.value,
      gasLimit: tx.gasLimit
    })
    userOperation = await ethers.utils.resolveProperties(userOperation);
    //Validate userop
    const requestId = aaProvider.smartAccountAPI.getUserOpHash(userOperation);
    var receipt = await (await demoAccount.connect(entryPointSigner).validateUserOp(userOperation, requestId, ethers.constants.AddressZero, 0)).wait();
    // console.log(receipt);
  });
});

class MultiSignerAccountAPI extends BaseAccountAPI {
  
  constructor(params) {
      super(params);
      this.signers = params.signers;
  }

  async getAccountInitCode() {
      //对应initCode字段
      return "0x";
  }
  async getNonce() {
      //对应nonce字段
      const senderAddr = await this.getAccountAddress();
      const accountContract = new ethers.Contract(senderAddr, abi);
      const originalProvider = this.provider;
      const nonce = await accountContract.connect(originalProvider).nonce();
      return nonce;
  }
  async encodeExecute(target, value, data){
      const senderAddr = await this.getAccountAddress();
      const accountContract = new ethers.Contract(senderAddr, abi);
      const ret = accountContract.interface.encodeFunctionData("viewCall", ["hello"]);
      return data;
  }
  async signUserOpHash (userOpHash) {
      //对应signature字段。你可以使用BLS等各式各样的签名手段，只要链上可以验证即可
      var signatures = [];
      const userOpHashBytes = ethers.utils.arrayify(userOpHash);
      for (var signer of this.signers){
        const addrStr = signer.address.substring(2);//remove 0x
        const sigStr = (await signer.signMessage(userOpHashBytes)).substring(2);//remove 0x
        signatures.push(addrStr);//remove 0x
        signatures.push(sigStr);//remove 0x
      }
      return "0x"+ signatures.join('');
  }
}

async function getAAProvider(entryPointSigner, accountContract, originalSigner, originalSigner2) {
  const entryPointAddress = await entryPointSigner.getAddress();
  const originalProvider = ethers.provider;
  const clientConfig = {
    entryPointAddress: entryPointAddress,
    bundlerUrl: 'http://localhost:3000/rpc',
    walletAddres: accountContract.address,
  };

  const chainId = await ethers.provider.getNetwork().then(net => net.chainId);
  const httpRpcClient = new HttpRpcClient(clientConfig.bundlerUrl, clientConfig.entryPointAddress, chainId);
  const entryPoint = EntryPoint__factory.connect(clientConfig.entryPointAddress, originalSigner);
  
  const smartAccountAPI = new MultiSignerAccountAPI(
      {
          provider: originalProvider,
          entryPointAddress: clientConfig.entryPointAddress,
          accountAddress: clientConfig.walletAddres,
          signers: [originalSigner, originalSigner2]
      }
  );

  const aaProvider = await new ERC4337EthersProvider(
      chainId,
      clientConfig,
      originalSigner,
      originalProvider,
      httpRpcClient,
      entryPoint,
      smartAccountAPI
  );
  return aaProvider;
}