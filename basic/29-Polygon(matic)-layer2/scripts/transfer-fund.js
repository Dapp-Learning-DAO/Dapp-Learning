
const { waffle } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    console.log("owner address ",owner.address)
    let result = await owner.getBalance();
    console.log("balance ", ethers.utils.formatEther(result))
  
   // //// Send  matic to an ens name.
    const tx =  {
        to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        value: ethers.utils.parseEther("0.0001")
    };
    
    await owner.sendTransaction(tx);
     result = await owner.getBalance();
    console.log("balance after ", ethers.utils.formatEther(result))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
