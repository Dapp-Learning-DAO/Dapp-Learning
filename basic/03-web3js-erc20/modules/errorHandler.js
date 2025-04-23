class Web3Error extends Error {
    constructor(message, code, data) {
        super(message);
        this.name = 'Web3Error';
        this.code = code;
        this.data = data;
    }
}

class TransactionError extends Error {
    constructor(message, txHash, receipt) {
        super(message);
        this.name = 'TransactionError';
        this.txHash = txHash;
        this.receipt = receipt;
    }
}

class ContractError extends Error {
    constructor(message, contractAddress, method) {
        super(message);
        this.name = 'ContractError';
        this.contractAddress = contractAddress;
        this.method = method;
    }
}

class ErrorHandler {
    static async handle(error, web3) {
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);

        if (error instanceof Web3Error) {
            console.error('Web3 error code:', error.code);
            console.error('Error data:', error.data);
        }

        if (error instanceof TransactionError && web3) {
            try {
                if (error.txHash) {
                    const receipt = await web3.eth.getTransactionReceipt(error.txHash);
                    console.error('Transaction receipt:', receipt);
                }
            } catch (e) {
                console.error('Failed to get transaction receipt:', e.message);
            }
        }

        if (error instanceof ContractError) {
            console.error('Contract address:', error.contractAddress);
            console.error('Method:', error.method);
        }

        // await this.reportError(error);
    }

    static isOutOfGas(error) {
        return error.message.includes('out of gas');
    }

    static isRevert(error) {
        return error.message.includes('revert');
    }

    static isNetworkError(error) {
        return error.message.includes('network') || error.message.includes('connection');
    }
}

module.exports = {
    Web3Error,
    TransactionError,
    ContractError,
    ErrorHandler
};