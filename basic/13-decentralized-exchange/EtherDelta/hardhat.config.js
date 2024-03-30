const fs = require("fs");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
// load privateKeys to harhat network
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
    }
  }
};
