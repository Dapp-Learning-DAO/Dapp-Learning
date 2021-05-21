// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ipfsAPI = require('ipfs-api')
const fs = require("fs");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    const contractfactory = await ethers.getContractFactory("ERC721");
    const erc721Ins = await contractfactory.deploy("ERC721","Token");

    console.log("ERC721 address:", erc721Ins.address);

    // 调用 ipfs add 上传文件
    console.log("Going to add art.jpg to ipfs")
    const ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})
    const filecontent = fs.readFileSync('./art.jpg')
    const filesHash= (await ipfs.add(filecontent))[0].hash

    console.log(`IPFS URL of art.jpg is : /ipfs/${filesHash}`)

    // 文件 hash 上链
    console.log("Going to create asset 999 with ipfs url")
    const ipfsurl = "/ipfs/" + filesHash
    await erc721Ins.issueWithAssetURI(deployer.address, 999, ipfsurl,0)

    // 获取资产 99 的 url
    console.log("Going to get ipfs url of asset 999")
    console.log("The URl of asset 999 is: ", (await erc721Ins.assetURI(999)))


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
