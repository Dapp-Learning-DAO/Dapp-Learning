const {task} = require("hardhat/config");
const {ERC4337EthersProvider, ERC4337EthersSigner, HttpRpcClient} = require("@account-abstraction/sdk");
const {EntryPoint__factory} = require('@account-abstraction/contracts');
const { BaseAccountAPI } = require("@account-abstraction/sdk/dist/src/BaseAccountAPI");
const abi = require("../artifacts/contracts/DemoAccount.sol/DemoAccount.json").abi;
const { getUserOpHash } = require('@account-abstraction/utils');
const {BigNumber} = require("ethers");


task("sendUserOp", "")
  .addPositionalParam("account")
  .setAction(async (taskArgs) => {

    const account = taskArgs.account;

    const entryPointAddress = "0x1306b01bC3e4AD202612D3843387e94737673F53";
    const originalProvider = ethers.provider;
    const originalSigner = await ethers.provider.getSigner();
    const clientConfig = {
      entryPointAddress: entryPointAddress,
      bundlerUrl: 'http://localhost:3000/rpc',
      walletAddres: account,
    };

    const chainId = await ethers.provider.getNetwork().then(net => net.chainId);
    const httpRpcClient = new HttpRpcClient(clientConfig.bundlerUrl, clientConfig.entryPointAddress, chainId);
    const entryPoint = EntryPoint__factory.connect(clientConfig.entryPointAddress, originalSigner);
    
    const smartAccountAPI = new DemoAccountAPI(
        {
            provider: originalProvider,
            entryPointAddress: clientConfig.entryPointAddress,
            accountAddress: account,
        }
    );

    const aaProvider = await new MyProvider(
        chainId,
        clientConfig,
        originalSigner,
        originalProvider,
        httpRpcClient,
        entryPoint,
        smartAccountAPI
    );
    
    const aaSigner = await aaProvider.getSigner();
    const demoWallet = new ethers.Contract(account, abi);
    try{
        // await demoWallet.connect(aaSigner).changeThreshold(1);

        // await demoWallet.connect(originalSigner).validateUserOp(
        //     {
        // sender: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        // nonce: 0,
        // initCode: '0x',
        // callData: '0xb7f3358d0000000000000000000000000000000000000000000000000000000000000001',
        // callGasLimit: BigNumber.from("28686"),
        // verificationGasLimit:BigNumber.from("100000"),
        // maxFeePerGas: BigNumber.from("2011370518"),
        // maxPriorityFeePerGas: BigNumber.from("1500000000"),
        // paymasterAndData: '0x',
        // preVerificationGas: BigNumber.from("45776"),
        // signature: '0x94dfd7d9b93782074f66343853e20824b35835dc265b01fa5fca4a1623701ec721a805d9ffd130bfe488076265f599225a17d1ef895c83a120b0fa321508aeb11c'
        // },
        // "0x777f27dd3d43a9d2d1ab364bd90e83bccb83d52a209e5037615eab7f4dcdbbb0",
        // "0x0165878A594ca255338adfa4d48449f69242Eb8F",
        // 0
        // );
        const entryPointContract = new ethers.Contract(entryPointAddress, EntryPoint__factory.abi, originalSigner);
        await entryPointContract.simulateHandleOp(
                {
        sender: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        nonce: 0,
        initCode: '0x',
        callData: '0xb7f3358d0000000000000000000000000000000000000000000000000000000000000001',
        callGasLimit: BigNumber.from("28686"),
        verificationGasLimit:BigNumber.from("100000"),
        maxFeePerGas: BigNumber.from("2011370518"),
        maxPriorityFeePerGas: BigNumber.from("1500000000"),
        paymasterAndData: '0x',
        preVerificationGas: BigNumber.from("45776"),
        signature: '0x94dfd7d9b93782074f66343853e20824b35835dc265b01fa5fca4a1623701ec721a805d9ffd130bfe488076265f599225a17d1ef895c83a120b0fa321508aeb11c'
      }
        );
    }
    catch(e){
        console.log(e);
    }
  });


class MyProvider extends ERC4337EthersProvider {
    constructor(chainId,config, originalSigner, originalProvider, httpRpcClient, entryPoint, smartAccountAPI){
        super(chainId,config, originalSigner, originalProvider, httpRpcClient, entryPoint, smartAccountAPI);
        this.signer = new MySigner(config, originalSigner, this, httpRpcClient, smartAccountAPI)
    }
    
    getSigner() {
        return this.signer;
    }

    async constructUserOpTransactionResponse(userOp1) {
        return super.constructUserOpTransactionResponse(userOp1);
    }
}

class MySigner extends ERC4337EthersSigner {
    
    constructor(config, originalSigner, erc4337provider, httpRpcClient, smartAccountAPI) {
        super(config, originalSigner, erc4337provider, httpRpcClient, smartAccountAPI);
    }

    async sendTransaction (transaction) {
        return await super.sendTransaction(transaction);
    }
    
}

class DemoAccountAPI extends BaseAccountAPI {
    constructor(params) {
        super(params);
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
        const ret = await this.provider.getSigner().signMessage(ethers.utils.arrayify(userOpHash))
        return ret;
    }
    // async createSignedUserOp(info){
    //     var dbg = await super.createSignedUserOp(info);
    //     dbg = await ethers.utils.resolveProperties(ret);//把Promise的数据都解析出来
    //     console.log(dbg);
    //     return dbg;
    // }
    // async getUserOpHash(userOp){
    //     console.log("user op hash");

    //     const ret= await super.getUserOpHash(userOp);
    //     console.log(ret);
    //     return ret;
    // }
}
