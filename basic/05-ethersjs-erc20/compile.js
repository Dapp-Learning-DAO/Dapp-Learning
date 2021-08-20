const fs = require('fs')
const solc = require('solc')

// Get Path and Load Contract
const source = fs.readFileSync('SimpleToken.sol', 'utf8')

// Compile Contract
const input = {
  language: 'Solidity',
  sources: {
    'SimpleToken.sol': {
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
}

const tempFile = JSON.parse(solc.compile(JSON.stringify(input)))
const contractFile = tempFile.contracts['SimpleToken.sol']['SimpleToken']

// Export Contract Data
module.exports = contractFile
