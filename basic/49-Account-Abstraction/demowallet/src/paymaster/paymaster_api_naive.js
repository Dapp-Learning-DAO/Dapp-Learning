const {PaymasterAPI} = require("@account-abstraction/sdk/dist/src/PaymasterAPI");


class PaymasterAPINaive extends PaymasterAPI {
    
    constructor(paymasterAddr) {
        super();
        this.paymasterAddr = paymasterAddr;    
    }

    //虽然4337规定了paymaster由paymaster+data构成，但是当前（0.4.0）版本下，paymasterAndData其实只有paymaster部分被用到
    async getPaymasterAndData (userOp) {
        return this.paymasterAddr;
    }
}

module.exports = {
    PaymasterAPINaive
}