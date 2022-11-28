const ethers = require("ethers");

async function withdrawETHTo(zkWallet, targetAddress, costEth) { // L2 to L1
    console.log("Transfering from L2 to L1 ...");
    const withdraw = await zkWallet.withdrawFromSyncToEthereum({
        ethAddress: targetAddress,
        token: "ETH",
        amount: ethers.utils.parseEther(costEth),
    });

    await withdraw.awaitVerifyReceipt();
    
    console.log("Transfer from L2 to L1 successfully");
    console.log({withdraw});
}

module.exports = withdrawETHTo;