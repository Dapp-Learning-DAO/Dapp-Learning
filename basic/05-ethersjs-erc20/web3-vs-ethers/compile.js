const fs = require('fs');
const path = require('path');
const solc = require('solc');

const source = fs.readFileSync('Increment.sol', 'utf-8');

const input = {
  language: 'Solidity',
  sources: {
    'Incrementer.sol': {
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

const output = JSON.parse(solc.compile(JSON.stringify(input)));
// for (let contractName in output['contracts']['Incrementer.sol']) {
// }
fs.writeFile(path.resolve('deployed', 'contract.json'), JSON.stringify(output['contracts']['Incrementer.sol']), (err) => {
  if (err) {
    console.error('===== compile failed =====', err);
    return;
  }
  console.log('===== compile successfully =====');
});
