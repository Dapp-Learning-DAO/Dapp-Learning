const ethers = require("ethers");

async function withdrawETHTo(zkWallet, targetAddress, costEth) { // L2 to L1
    console.log("L2 到 L1 转账中...");
    const withdraw = await zkWallet.withdrawFromSyncToEthereum({
        ethAddress: targetAddress,
        token: "ETH",
        amount: ethers.utils.parseEther(costEth),
    });

    await withdraw.awaitVerifyReceipt();
    
    console.log("L2 到 L1 转账完成");
    console.log({withdraw});
}

module.exports = withdrawETHTo;