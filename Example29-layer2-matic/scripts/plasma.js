
const { waffle } = require("hardhat");

const utils = require('./utils')

async function execute() {
    const { matic, network } = await utils.getMaticClient()
    const { from } = utils.getAccount()
    
    const token = network.Main.Contracts.Tokens.MaticWeth
    const amount = matic.web3Client.web3.utils.toWei('1.567')
    
    // deposit
    await matic.depositEther(token, from, amount).then((res) => {
    console.log("deposit hash: ", res.transactionHash)
    })
    //When a token is deposited from Ethereum to Matic, a process called state sync mechanism comes into play that eventually mints the tokens for the user on the Matic chain
    
    // transfer
    const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    
    const amount1 = matic.web3Client.web3.utils.toWei("1.23");
    
    await matic.transferEther(recipient, amount1, { from, parent: false })
        .then((res) => {
            console.log("Transfer hash: ", res.transactionHash);
        });

     //withdraw
    // 1 burn
    const amount2 = matic.web3Client.web3.utils.toWei("5.678");
    
    await matic.startWithdraw(token, amount2, { from }).then((res) => {
        console.log("Burn hash: ", res.transactionHash);
    });
    
    // wait 30m
    
    //This function can be called only after the checkpoint is included in the main chain
    // 2 confirm-withdraw
    const txHash = "<>";
    await matic.withdraw(txHash, { from, gas: "7000000" }).then((res) => {
        console.log("Confirm withdraw hash: ", res.transactionHash);
    });
    
    //Process Exit
    await matic.processExits(token, { from, gas: 7000000 }).then((res) => {
        console.log("Exit hash: ", res.transactionHash);
    });
    
    
    
    
}

execute().then(_ => process.exit(0))