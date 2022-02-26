const ethers = require("ethers");

async function depositETHToZksync(zkWallet, targetAddress, costEth) { // L1 to L2
    console.log("L1 到 L2 转账中....");
    const deposit = await zkWallet.depositToSyncFromEthereum({
        depositTo: targetAddress, // 可以给自己的地址转账
        token: "ETH",
        amount: ethers.utils.parseEther(costEth),
    })

    // Await confirmation from the zkSync operator
    // Completes when a promise is issued to process the tx
    const depositReceipt = await deposit.awaitReceipt();

    console.log("L1 到 L2 转账完成");
    console.log({ depositReceipt })
}

module.exports = depositETHToZksync;