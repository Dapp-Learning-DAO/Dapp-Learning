const config = require('../config');

class ContractInteractor {
    constructor(web3, contract) {
        this.web3 = web3;
        this.contract = contract;
    }

    async transfer(from, to, amount) {
        try {
            console.log(`Transferring ${amount} tokens from ${from.accountaddress} to ${to}...`);

            // Build transfer transaction
            const transferTx = this.contract.methods.transfer(to, amount).encodeABI();

            // Sign transaction
            const transferTransaction = await this.web3.eth.accounts.signTransaction(
                {
                    to: this.contract.options.address,
                    data: transferTx,
                    gas: config.gasConfig.transfer
                },
                from.privateKey
            );

            // Send transaction and wait for receipt
            const receipt = await this.web3.eth.sendSignedTransaction(
                transferTransaction.rawTransaction
            );

            console.log(`Transfer successful, transaction hash: ${receipt.transactionHash}`);
            return receipt;
        } catch (error) {
            console.error('Transfer failed:', error);
            throw error;
        }
    }

    async balanceOf(address) {
        try {
            const balance = await this.contract.methods.balanceOf(address).call();
            console.log(`Balance of address ${address}: ${balance}`);
            return balance;
        } catch (error) {
            console.error('Failed to query balance:', error);
            throw error;
        }
    }

    async totalSupply() {
        try {
            const supply = await this.contract.methods.totalSupply().call();
            console.log(`TOTAL supply: ${supply}`);
            return supply;
        } catch (error) {
            console.error('Failed to query total supply:', error);
            throw error;
        }
    }
}

module.exports = ContractInteractor;