const { ERC4337EthersProvider, ERC4337EthersSigner, HttpRpcClient, DefaultGasOverheads } = require("@account-abstraction/sdk");
const {MultiSigAccountAPI} = require("./multi_sig_account_api");
const {EntryPoint__factory} =require("@account-abstraction/contracts");
const { ethers , BigNumber} = require("ethers");

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
      return super.getNonce();
  }

    //I rewrite it because there are three potential defects on calculation of preVerificationGas in bundler of eth-infinitism.
    //Here is the pull request:https://github.com/eth-infinitism/bundler/pull/43
    async createUnsignedUserOp (info){
        const {
          callData,
          callGasLimit
        } = await this.encodeUserOpCallDataAndGasLimit(info)
        const initCode = await this.getInitCode()
    
        const initGas = await this.estimateCreationGas(initCode)
        const verificationGasLimit = BigNumber.from(await this.getVerificationGasLimit())
          .add(initGas)
    
        let {
          maxFeePerGas,
          maxPriorityFeePerGas
        } = info;

        if (!maxFeePerGas || !maxPriorityFeePerGas) {
          const feeData = await this.provider.getFeeData()
          if (!maxFeePerGas) {
            maxFeePerGas = feeData.maxFeePerGas ?? undefined
          }
          if (!maxPriorityFeePerGas) {
            maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined
          }
        }
    
        var partialUserOp = {
          sender: this.getAccountAddress(),
          nonce: this.getNonce(),
          initCode,
          callData,
          callGasLimit,
          verificationGasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          paymasterAndData: "0x"
        }

        let paymasterAndData;

        if (this.paymasterAPI) {
          // fill (partial) preVerificationGas (all except the cost of the generated paymasterAndData)
          const userOpForPm = {
            ...partialUserOp,
            preVerificationGas: await this.getPreVerificationGas(partialUserOp)
          }
          paymasterAndData = await this.paymasterAPI.getPaymasterAndData(userOpForPm)
        }
        partialUserOp.paymasterAndData = paymasterAndData ?? '0x'
        return {
          ...partialUserOp,
          preVerificationGas: this.getPreVerificationGas(partialUserOp),
          signature: ''
        }
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