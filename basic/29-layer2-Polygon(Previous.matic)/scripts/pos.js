
const { waffle } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    console.log("owner address ",owner.address)
    let result = await owner.getBalance();
    console.log("balance ", ethers.utils.formatEther(result))
    
    const parentProvider = 'https://goerli.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07'
    const maticProvider = 'https://polygon-mumbai.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07'
    // for mumbai testnet
    const maticPOSClient = new MaticPOSClient({
        network: "testnet",
        version: "mumbai",
        parentProvider: parentProvider,
        maticProvider: maticProvider});
    
    //deposit
    await maticPOSClient.depositEtherForUser(from, amount, {
        from,
        gasPrice: "10000000000",
    });
    //  takes about ~5-7 minutes.
    
    //burn
    await maticPOSClient.burnERC20(childToken, amount, { from });
    
    
    await maticPOSClient.exitERC20(burnTxHash, { from });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
