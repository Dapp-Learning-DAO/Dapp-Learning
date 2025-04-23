const Web3 = require('web3');
const config = require('../config');

class ContractDeployer {
    constructor(web3, account) {
        this.web3 = web3;
        this.account = account;
    }

    async deploy(abi, bytecode, args) {
        try {
            console.log(`Deploying contract from account ${this.account.accountaddress}...`);

            // create contract instance
            const deployContract = new this.web3.eth.Contract(abi);

            // create deploy transaction
            const deployTx = deployContract.deploy({
                data: bytecode,
                arguments: args || [config.tokenConfig.name, config.tokenConfig.symbol, config.tokenConfig.decimals, config.tokenConfig.initialSupply]
            });

            // Sign transaction
            const deployTransaction = await this.web3.eth.accounts.signTransaction(
                {
                    data: deployTx.encodeABI(),
                    gas: config.gasConfig.deploy
                },
                this.account.privateKey
            );

            // Send transaction and wait for receipt
            const deployReceipt = await this.web3.eth.sendSignedTransaction(
                deployTransaction.rawTransaction
            );

            console.log(`Contract deployed to address: ${deployReceipt.contractAddress}`);

            // return contract instance
            return new this.web3.eth.Contract(abi, deployReceipt.contractAddress);
        } catch (error) {
            console.error('Contract deployment failed:', error);
            throw error;
        }
    }
}

module.exports = ContractDeployer;