const ethers = require("ethers");

async function depositETHToZksync(zkWallet, targetAddress, costEth) { // L1 to L2
    console.log("Transfering from L1 to L2 ....");
    const deposit = await zkWallet.depositToSyncFromEthereum({
        depositTo: targetAddress, // Can be the same address
        token: "ETH",
        amount: ethers.utils.parseEther(costEth),
    })

    // Await confirmation from the zkSync operator
    // Completes when a promise is issued to process the tx
    const depositReceipt = await deposit.awaitReceipt();

    console.log("Transfer from L1 to L2 successfully");
    console.log({ depositReceipt })
}

module.exports = depositETHToZksync;