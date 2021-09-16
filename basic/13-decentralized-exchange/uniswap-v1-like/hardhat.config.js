require("@nomiclabs/hardhat-waffle");
const { utils } = require("ethers");
const { GAS_PRICE } = require("./utils")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      accounts: {
        // 初始化账户给 1000000 eth 默认 100 不够用
        accountsBalance: utils.parseEther("1000000").toString(),
      },
      // gasPrice 1000000000 默认 8000000000
      // 便于计算gas费用
      gasPrice: GAS_PRICE.toNumber(),
    },
  },
  solidity: "0.8.4",
};
