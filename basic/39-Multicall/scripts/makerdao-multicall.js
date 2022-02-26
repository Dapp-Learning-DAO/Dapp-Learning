const { createWatcher } = require('@makerdao/multicall');
require('dotenv').config()

const MKR_TOKEN = '0xaaf64bfcc32d0f15873a02163e7e500671a4ffcd';
const MKR_WHALE = '0xdb33dfd3d61308c33c63209845dad3e6bfb2c674';
const MKR_FISH = '0x2dfcedcb401557354d0cf174876ab17bfd6f4efd';
const PRICE_FEED_ETH = '0xa5aA4e07F5255E14F02B385b1f04b35cC50bdb66';

// Preset can be 'mainnet', 'kovan', 'rinkeby', 'goerli' or 'xdai'
// const config = { preset: 'kovan' };

// Alternatively the rpcUrl and multicallAddress can be specified manually
const config = {
  rpcUrl: `wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`,
  multicallAddress: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  interval: 1000,
};

(async () => {
  const watcher = createWatcher(
    [
      {
        call: ['getEthBalance(address)(uint256)', '0x72776bb917751225d24c07d0663b3780b2ada67c'],
        returns: [['ETH_BALANCE', (val) => val / 10 ** 18]],
      },
      {
        target: MKR_TOKEN,
        call: ['balanceOf(address)(uint256)', MKR_WHALE],
        returns: [['BALANCE_OF_MKR_WHALE', (val) => val / 10 ** 18]],
      },
      {
        target: PRICE_FEED_ETH,
        call: ['peek()(uint256,bool)'],
        returns: [['PRICE_FEED_ETH_PRICE', (val) => val / 10 ** 18], ['PRICE_FEED_ETH_SET']],
      },
    ],
    config
  );

  watcher.subscribe((update) => {
    console.log(`Update: ${update.type} = ${update.value}`);
  });

  watcher.batch().subscribe((updates) => {
    // Handle batched updates here
    // Updates are returned as { type, value } objects, e.g:
    // { type: 'BALANCE_OF_MKR_WHALE', value: 70000 }
  });

  watcher.onNewBlock((blockNumber) => {
    console.log(`New block: ${blockNumber}`);
  });

  setTimeout(async () => {
    watcher.start();

    await watcher.awaitInitialFetch();

    console.log('Initial fetch completed');

    // Update the calls
    setTimeout(() => {
      console.log('Updating calls...');
      const fetchWaiter = watcher.tap((calls) => [
        ...calls,
        {
          target: MKR_TOKEN,
          call: ['balanceOf(address)(uint256)', MKR_FISH],
          returns: [['BALANCE_OF_MKR_FISH', (val) => val / 10 ** 18]],
        },
      ]);
      fetchWaiter.then(() => {
        console.log('Initial fetch completed');
      });
    }, 1000);

    // Recreate watcher (useful if network has changed)
    setTimeout(() => {
      console.log('Recreating with new calls and config...');
      const fetchWaiter = watcher.recreate(
        [
          {
            target: MKR_TOKEN,
            call: ['balanceOf(address)(uint256)', MKR_WHALE],
            returns: [['BALANCE_OF_MKR_WHALE', (val) => val / 10 ** 18]],
          },
        ],
        config
      );
      fetchWaiter.then(() => {
        console.log('Initial fetch completed');
      });
    }, 2000);
  }, 1);

  // When subscribing to state updates, previously cached values will be returned immediately
  // setTimeout(() => {
  //   console.log(
  //     'Subscribing to updates much later (will immediately return cached values)'
  //   );
  //   watcher.subscribe(update => {
  //     console.log(
  //       `Update (2nd subscription): ${update.type} = ${update.value}`
  //     );
  //   });
  //   watcher.onNewBlock(blockNumber => {
  //     console.log(`New block (2nd subscription): ${blockNumber}`);
  //   });
  // }, 15000);
})();

(async () => {
  await new Promise((res) => {
    setTimeout(res, 60000);
  });
})();
