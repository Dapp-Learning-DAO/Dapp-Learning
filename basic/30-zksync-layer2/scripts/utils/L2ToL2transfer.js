const zksync = require("zksync");

async function sendTx(zkWallet, newAddr, cost) { // L2 to L2
    const isSigningKeySet = await zkWallet.isSigningKeySet()

    console.log("isSigningKeySet: ", isSigningKeySet)

    // Need to unlock, before do transfer on L2
    if (!isSigningKeySet) {

        if ((await zkWallet.getAccountId()) == undefined) {
            throw new Error("Unknown Account Id")
        }

        console.log("Signing...")

        // As any other kind of transaction, `ChangePubKey` transaction requires fee.
        // User doesn't have (but can) to specify the fee amount. If omitted, library will query zkSync node for
        // the lowest possible amount.
        const changePubkey = await zkWallet.setSigningKey({
            ethAuthType: "ECDSA", 
            feeToken: "ETH",
            // fee: ethers.utils.parseEther("0.0002") fee is optional
        });

        // Wait until the tx is committed
        const receipt = await changePubkey.awaitReceipt();

        console.log("changePubkey: ", changePubkey);
        console.log();
        console.log("receipt: ", receipt);

        const isSigningKeySet = await zkWallet.isSigningKeySet()
        console.log("isSigningKeySet: ", isSigningKeySet)
    }

    const amount = zksync.utils.closestPackableTransactionAmount(
        ethers.utils.parseEther(cost))

    console.log("Transfering from L2 to L2 ...")

    const transfer = await zkWallet.syncTransfer({
        to: newAddr,
        token: "ETH",
        amount,
        // fee, fee is optional
    });

    console.log("Transfer from L2 to L2 successfully");

    return transfer
}

module.exports = sendTx;