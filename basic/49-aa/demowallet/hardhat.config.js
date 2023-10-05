require("@nomicfoundation/hardhat-toolbox");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    hardhat:{
      allowUnlimitedContractSize: true
    },
    localhost:{
      allowUnlimitedContractSize: true
    },
  }
};
