const dotenv = require('dotenv');
const path = require('path');
const env = dotenv.config({
  path: path.join(__dirname, '../.env')
});

if (env.error) {
  throw new Error("no env file found");
}

module.exports = {
  rpc: {
    parent: process.env.PARENT_RPC,
    child: process.env.CHILD_RPC,
  },
  ERC20: {
    parent: {
      ether: '0x0000000000000000000000000000000000000000',
      erc20: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    },
    child: {
      ether: '0x0000000000000000000000000000000000000000',
      erc20: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    },
  },
  user1: {
    // '<paste your private key here>' - A sample private key prefix with `0x`
    privateKey: process.env.USER1_PRIVATE_KEY,
    //'<paste address belonging to private key here>', Your address
    address: process.env.USER1_FROM
  },
  user2: {
    address: process.env.USER2_FROM
  }
}
