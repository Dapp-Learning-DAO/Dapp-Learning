require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();


function mnemonic() {
  //can config 3 PRIVATE_KEY
  //return process.env.PRIVATE_KEY,process.env.PRIVATE_KEY1,process.env.PRIVATE_KEY2;
  return process.env.PRIVATE_KEY;
}
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks:{
    hardhat:{
      allowUnlimitedContractSize: true
    },
    localhost:{
      allowUnlimitedContractSize: true
    },
    sepolia: {
      url: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.APIKEY,
    },
  }
};
