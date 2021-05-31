require("@nomiclabs/hardhat-waffle");
//todo import typechain
//require("hardhat-typechain");
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

  return fs.readFileSync("./sk.txt").toString().trim();

}

function mnemonicAlice() {

  return fs.readFileSync("./sk-alice.txt").toString().trim();

}

function mnemonicBob() {

  return fs.readFileSync("./sk-bob.txt").toString().trim();

}

function mnemonicTest() {

  return fs.readFileSync("./sk-test.txt").toString().trim();

}
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.4.25",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      //gasPrice: 125000000000,//you can adjust gasPrice locally to see how much it will cost on production
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/3f8471cb133047efa90cb89936e9f8bb", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
    kovan: {
      url: "https://kovan.infura.io/v3/3f8471cb133047efa90cb89936e9f8bb", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic(),
        mnemonicAlice(),
        mnemonicBob(),
        mnemonicTest()
      ],
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/3f8471cb133047efa90cb89936e9f8bb", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/3f8471cb133047efa90cb89936e9f8bb", //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
  }
};

