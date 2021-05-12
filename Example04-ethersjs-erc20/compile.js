const fs = require('fs');
const solc = require('solc');

// Get Path and Load Contract
const source = fs.readFileSync('erc20.sol','utf8');

// Compile Contract
const input = {
   language: 'Solidity',
   sources: {
      'erc20.sol': {
         content: source,
      },
   },
   settings: {
      outputSelection: {
         '*': {
            '*': ['*'],
         },
      },
   },
};

const contractFile=solc.compile(source,1);

// Export Contract Data
module.exports = contractFile;
