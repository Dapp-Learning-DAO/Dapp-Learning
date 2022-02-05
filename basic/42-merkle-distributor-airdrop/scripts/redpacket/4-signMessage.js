// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
var Web3 = require('web3');
require('dotenv').config();

async function main() {
  // const [deployer] = await ethers.getSigners();

  // let messageHash = ethers.utils.id('0xa3F2Cf140F9446AC4a57E9B72986Ce081dB61E75')
  // let messageHashBytes = ethers.utils.arrayify(messageHash)

  //   // Sign the binary data
  //   let flatSig = await deployer.signMessage(messageHashBytes)

  // Provider
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      'https://kovan.infura.io/v3/' + process.env.INFURA_ID
    )
  );

  const target_account = "0xa3F2Cf140F9446AC4a57E9B72986Ce081dB61E75";
  var signedMsg = web3.eth.accounts.sign(process.env.TARGET_ACCOUNT, process.env.PRIVATE_KEY).signature
  console.log("Sign Message: ", signedMsg,)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
