const { getPosClient, from, to , ERC20} = require('./pos');

const execute = async () => {
    const client = await getPosClient();
    const erc20TokenL1 = client.erc20(ERC20.parent.erc20, true);
    const erc20TokenL2 = client.erc20(ERC20.child.erc20, false);
    let erc20TokenL1Balance = await erc20TokenL1.getBalance(from);
    const erc20TokenL2Balance = await erc20TokenL2.getBalance(from);
    console.log("erc20TokenL1Balance: ", erc20TokenL1Balance/1e18);
    console.log("erc20TokenL2Balance: ", erc20TokenL2Balance/1e18);

    let erc20TokenL1BalanceOfTo = await erc20TokenL1.getBalance(to);
    console.log("erc20TokenL1BalanceOfTo: ", erc20TokenL1BalanceOfTo/1e18);

    const transferResult = await erc20TokenL1.transfer("10000000000000000000", to, {
        gasPrice: '30000000000',
    });

    txHash = await transferResult.getTransactionHash();
    console.log("txHash", txHash);

    erc20TokenL1BalanceOfTo = await erc20TokenL1.getBalance(to);
    console.log("erc20TokenL1BalanceOfTo after transfer: ", erc20TokenL1BalanceOfTo/1e18);

    erc20TokenL1Balance = await erc20TokenL1.getBalance(from);
    console.log("erc20TokenL1Balance after transfer: ", erc20TokenL1Balance/1e18);
}
execute().then(() => {
}).catch(err => {
    console.error("err", err);

}).finally(_ => {
    process.exit(0);
})