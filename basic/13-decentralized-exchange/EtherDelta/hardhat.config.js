require("@nomiclabs/hardhat-waffle");
const fs = require("fs");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function mnemonic() {

  return process.env.PRIVATE_KEY

}

// 加载本地privateKeys到harhat本地测试网络
function loadTestAccounts() {
  const privateKyes = JSON.parse(fs.readFileSync("./testAccounts.json"));
  return privateKyes.map((_privateKey, index) => ({
    mnemonic: _privateKey,
    privateKey: _privateKey,
    initialIndex: index,
    // path: 'm/44'/60'/0'/0'
    count: 20,
    accountsBalance: "100000000000000000000000000",
    balance: "100000000000000000000000000"
  }))
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      accounts: loadTestAccounts()
    },
    localhost: {
      url: "http://localhost:8545",
    },
    // rinkeby: {
    //   url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
    //   accounts: [
    //   mnemonic()
    //   ],
    // },
    // kovan: {
    //   url: "https://kovan.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
    //   accounts: [
    //     mnemonic()
    //   ],
    // },
    // mainnet: {
    //   url: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
    //   accounts: [
    //     mnemonic()
    //   ],
    // },
    // ropsten: {
    //   url: "https://ropsten.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
    //   accounts: [
    //     mnemonic()
    //   ],
    // },
  }
};