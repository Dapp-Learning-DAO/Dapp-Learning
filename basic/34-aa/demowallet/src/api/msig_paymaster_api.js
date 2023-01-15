const { ERC4337EthersProvider, ERC4337EthersSigner, HttpRpcClient, DefaultGasOverheads } = require("@account-abstraction/sdk");
const {MultiSigAccountAPI} = require("./multi_sig_account_api");
const {EntryPoint__factory} =require("@account-abstraction/contracts");
const { ethers } = require("ethers");

class MsigPaymasterAccountAPI extends MultiSigAccountAPI {
  
    constructor(params) {
        super(params);
        this.factoryContract = params.facInfo.factoryContract;
        this.senderInitCode = params.facInfo.senderInitCode;
        this.senderSalt = params.facInfo.senderSalt;
    }
    
    //address(20bytes) + calldata(selector + creationCode + args)
    async getAccountInitCode() {
        const calldata = this.factoryContract.interface.encodeFunctionData("deploy", [this.senderInitCode,this.senderSalt]);
        return ethers.utils.solidityPack(["address", "bytes"],[this.factoryContract.address, calldata]);
    }

    //Because address is not deployed yet, we cannot access the nonce in the contract directly
    async getNonce() {
        if (await this.checkAccountPhantom()){
            return 0;
        }
        //对应nonce字段
        const senderAddr = await this.getAccountAddress();
        const accountContract = new ethers.Contract(senderAddr, abi);
        const originalProvider = this.provider;
        const nonce = await accountContract.connect(originalProvider).nonce();
        return nonce;
    }
}
  

async function getAAProvider(entryPointAddress, accountContractAddress, bundlerUrl, originalProvider, signers, facInfo, paymasterAPI) {

    const clientConfig = {
      entryPointAddress: entryPointAddress,
      bundlerUrl: bundlerUrl,
      walletAddres: accountContractAddress,
    };
    
    const chainId = await originalProvider.getNetwork().then(net => net.chainId);
    const httpRpcClient = new HttpRpcClient(clientConfig.bundlerUrl, clientConfig.entryPointAddress, chainId);
    const entryPoint = EntryPoint__factory.connect(clientConfig.entryPointAddress, signers[0]);

    const smartAccountAPI = new MsigPaymasterAccountAPI(
        {
            provider: originalProvider,
            entryPointAddress: clientConfig.entryPointAddress,
            accountAddress: clientConfig.walletAddres,
            signers: signers,
            overheads: {
                ...DefaultGasOverheads,
                fixed: 30000
            },
            facInfo,//To initCode
            paymasterAPI//to implement paymasterAndData
        }
    );
  
    const aaProvider = await new ERC4337EthersProvider(
        chainId,
        clientConfig,
        signers[0],
        originalProvider,
        httpRpcClient,
        entryPoint,
        smartAccountAPI
    );
    return aaProvider;
}

module.exports = {
    MsigPaymasterAccountAPI,
    getAAProvider
}