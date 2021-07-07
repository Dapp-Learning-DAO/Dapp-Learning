async function main() {
    // Deploy ERC20
    const erc20ContractFactory = await ethers.getContractFactory("MYERC721");
    const contract = erc20ContractFactory.attach("0xc43d0a98D399b569cFC6285f68c6A94D3dE31386")

    const url = await contract.tokenURI(0)
    console.log("URl :", url)
    
    // Save
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });