require("@nomicfoundation/hardhat-toolbox");

require("./tasks");


// task("deploy", "")
//   .addPositionalParam("param1")
//   .addPositionalParam("param2")
//   .setAction(async (taskArgs) => {
//     console.log(taskArgs);
//   });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    hardhat:{
      allowUnlimitedContractSize: true
    }
  }
};
