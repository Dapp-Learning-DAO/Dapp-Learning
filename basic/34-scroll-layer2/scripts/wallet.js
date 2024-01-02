// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
require('dotenv').config()

async function main() {

  

  const mnemonic = process.env.mem;
  let array= new Array();

  for (let index = 0; index < 10; index++) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`);
        console.log(wallet.address);
        array.push(wallet.address);
   }

    const Sender = await ethers.getContractFactory("MultipleEtherTransfer");
    //let senderContract = await Sender.deploy();
    let senderContract = await Sender.attach("");
    await  senderContract.transferMultiple(array);

    for (let index = 0; index < 10; index++) {
      let wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`);
      wallet = wallet.connect( ethers.provider)
      console.log(wallet.address);
    //  console.log("Account balance:", (await wallet.getBalance()).toString());
  
    const factoryContractDeployer = await ethers.getContractFactory("ExampleContractFactory",wallet);
   
    await factoryContractDeployer.deploy()
     
 }



  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
