// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

const { ethers, network } = require("hardhat");



async function main() {

    const [deployer] = await ethers.getSigners();


    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    const contractfactory = await ethers.getContractFactory("MYERC721");
    const myerc721Ins = await contractfactory.deploy("MYERC721","TEST","");
    await myerc721Ins.waitForDeployment();

    console.log("ERC721 address:", myerc721Ins.target);

    // 监听 Transfer 事件
    myerc721Ins.on("Transfer", (from, to , token) => {
      console.log("Mint token successfully, and the token id is ", String(token));

      myerc721Ins.tokenURI(token).then((URL)=>{
        console.log(`The URL of token ${token} is ${URL}`)
        process.exit(0)
      }).catch(error => {
        console.error(error);
        process.exit(1);
      })
    })



    myerc721Ins.mintWithTokenURI(deployer.address, "www.baidu.com");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {})
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
