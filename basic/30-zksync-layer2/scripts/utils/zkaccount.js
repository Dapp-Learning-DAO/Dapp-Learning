async function getZkAccountInfo(zkWallet) {
    // Committed state is not final yet
    // let committedETHBalance = await zkWallet.getBalance("ETH");
    // console.log("CommittedETHBalance: ",committedETHBalance.toString())

    // Verified state is final
    const verifiedETHBalance = await zkWallet.getBalance("ETH", "verified");

    const accountId = await zkWallet.getAccountId();

    let isSigningKeySet = false
    let ethBalance = 0.0
    let extra = {}

    if (accountId == undefined) {
        extra["accountId"] = "Unknown Account Id"
    } else {
        isSigningKeySet = await zkWallet.isSigningKeySet();

        /// AccountState
        const state = await zkWallet.getAccountState();
        const committedBalances = state.committed.balances;

        committedETHBalance = committedBalances["ETH"];
        ethBalance = ethers.utils.formatEther(committedETHBalance)
    }

    let account = {}

    account["accountId"] = accountId
    account["committedETHBalance"] = committedETHBalance
    account["verifiedETHBalance"] = verifiedETHBalance
    account["isSigningKeySet"] = isSigningKeySet
    account["ethBalance"] = ethBalance
    account["extra"] = extra

    return account
}

// Export function getZkWallet
module.exports = getZkAccountInfo;