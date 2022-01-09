// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const { createWatcher } = require('@makerdao/multicall');

async function main() {
  const MKR_TOKEN = '0xaaf64bfcc32d0f15873a02163e7e500671a4ffcd';
  const MKR_WHALE = '0xdb33dfd3d61308c33c63209845dad3e6bfb2c674';
  const MKR_FISH = '0x2dfcedcb401557354d0cf174876ab17bfd6f4efd';
  // Preset can be 'mainnet', 'kovan', 'rinkeby', 'goerli' or 'xdai'
  const config = {
    rpcUrl: 'https://kovan.infura.io',
    multicallAddress: '0xc49ab4d7de648a97592ed3d18720e00356b4a806',
  };
  // Create watcher
  const watcher = createWatcher(
    [
      {
        target: MKR_TOKEN,
        call: ['balanceOf(address)(uint256)', MKR_WHALE],
        returns: [['BALANCE_OF_MKR_WHALE', (val) => val / 10 ** 18]],
      },
    ],
    config
  );

  console.log('---------------');
  // Subscribe to state updates
  watcher.subscribe((update) => {
    console.log(`Update: ${update.type} = ${update.value}`);
  });

  // Subscribe to batched state updates
  watcher.batch().subscribe((updates) => {
    // Handle batched updates here
    // Updates are returned as { type, value } objects, e.g:
    // { type: 'BALANCE_OF_MKR_WHALE', value: 70000 }
  });

  // Subscribe to new block number updates
  watcher.onNewBlock((blockNumber) => {
    console.log('New block:', blockNumber);
  });

  // Start the watcher polling
  watcher.start();

  function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  await sleep(3000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
