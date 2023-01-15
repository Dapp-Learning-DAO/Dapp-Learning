const { ERC4337EthersProvider, ERC4337EthersSigner, HttpRpcClient, DefaultGasOverheads } = require("@account-abstraction/sdk");
const {BaseAccountAPI} = require("@account-abstraction/sdk/dist/src/BaseAccountAPI");
const {EntryPoint__factory} =require("@account-abstraction/contracts");
const { ethers } = require("ethers");
const abi = require("../../artifacts/contracts/DemoAccount.sol/DemoAccount.json").abi;
class MultiSigAccountAPI extends BaseAccountAPI {
  
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
        if (senderAddr != target) {
            //In this case this gonna call some other contract so we go through "execute"
            const senderContract = new ethers.Contract(ethers.constants.AddressZero, abi);
            return senderContract.interface.encodeFunctionData("execute", [target, data, value]);
        } else{
            //In this case this is the call to sender itself
            return data;
        }
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

    //For debug
    async createSignedUserOp (info){
        const ret = await super.createSignedUserOp(info);
        // console.log(ret);
        return ret;
    }
}
  

async function getAAProvider(entryPointAddress, accountContractAddress, bundlerUrl, originalProvider, originalSigner, originalSigner2) {

    const clientConfig = {
      entryPointAddress: entryPointAddress,
      bundlerUrl: bundlerUrl,
      walletAddres: accountContractAddress,
    };
    
    const chainId = await originalProvider.getNetwork().then(net => net.chainId);
    const httpRpcClient = new HttpRpcClient(clientConfig.bundlerUrl, clientConfig.entryPointAddress, chainId);
    const entryPoint = EntryPoint__factory.connect(clientConfig.entryPointAddress, originalSigner);

    const smartAccountAPI = new MultiSigAccountAPI(
        {
            provider: originalProvider,
            entryPointAddress: clientConfig.entryPointAddress,
            accountAddress: clientConfig.walletAddres,
            signers: [originalSigner, originalSigner2],
            overheads: {
                ...DefaultGasOverheads,
                fixed: 30000
              }
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

module.exports = {
    MultiSigAccountAPI,
    getAAProvider
}