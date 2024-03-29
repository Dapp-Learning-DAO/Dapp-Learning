// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ipfsAPI = require('ipfs-api')
const fs = require("fs");
const { ethers, network } = require("hardhat");
const { checkServerIdentity } = require("tls");
const { resolve } = require("path");


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

    // 调用 ipfs add 上传文件
    console.log("Going to add art.jpg to ipfs")
    const ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})
    const filecontent = fs.readFileSync('./art.jpg')
    const filesHash= (await ipfs.add(filecontent))[0].hash

    console.log(`IPFS URL of art.jpg is : /ipfs/${filesHash}`)

    // 文件 hash 上链
    console.log("Going to create a token with ipfs url")
    const ipfsurl = "/ipfs/" + filesHash
    myerc721Ins.mintWithTokenURI(deployer.address, ipfsurl)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {})
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

