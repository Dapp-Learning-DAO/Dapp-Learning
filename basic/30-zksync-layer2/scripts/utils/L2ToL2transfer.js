const zksync = require("zksync");

async function sendTx(zkWallet, newAddr, cost) { // L2 to L2
    const isSigningKeySet = await zkWallet.isSigningKeySet()

    console.log("isSigningKeySet: ", isSigningKeySet)

    // L2 转账前，必须先解锁
    if (!isSigningKeySet) {

        if ((await zkWallet.getAccountId()) == undefined) {
            throw new Error("Unknown Account Id")
        }

        console.log("签名ing")

        // As any other kind of transaction, `ChangePubKey` transaction requires fee.
        // User doesn't have (but can) to specify the fee amount. If omitted, library will query zkSync node for
        // the lowest possible amount.
        const changePubkey = await zkWallet.setSigningKey({
            ethAuthType: "ECDSA", // 显式指定验证类型
            feeToken: "ETH",
            // fee: ethers.utils.parseEther("0.0002") 可以不设置fee
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

    console.log("L2 到 L2 转账中...")

    const transfer = await zkWallet.syncTransfer({
        to: newAddr,
        token: "ETH",
        amount,
        // fee, 可以不设置
    });

    console.log("L2 到 L2 转账完成");

    return transfer
}

module.exports = sendTx;