[中文](./README-CN.md) / English
# ethersjs-erc20

## About this task

This demo shows the procedure for creating an `ERC20` contract using `ethers.js`

Difference between `web3.js` and `ethers.js` can be seen [here](./web3-vs-ethers/README.md)
## Contents

1. Deploy an `ERC20` contract
   Deploying by using `depoly.js`. In this demo, we use the test network `Goerli` to deploy the contract, and we need to use an account with Ether to send the transaction.

2. Call the contract
   Call `transfer`, `balanceof` functions of the contract, and check the result.

3. Listen to events
   Listen `Transfer` events by using `providerContract.once` and `providerContract.on`

## How to run this task

1. Install dependencies

   ```js
   npm install
   // please use node v20.11.0
   ```

2. Config `.env`

   ```bash
   cp .env.example .env
   # replace the xxx and yyy with your own key
   PRIVATE_KEY=xxxxxxxxxxxxxxxx
   INFURA_ID=yyyyyyyy
   ```

3. Run it

   ```bash
   node index.js
   ```

4. check the pending transactions in mempool

   ```sh
   node mempool.js
   ```

## References

Official documentation:

- <https://docs.ethers.io/v4/api-providers.html>
- <https://docs.ethers.io/v5/getting-started/#getting-started--contracts>

Other resources(Chinese):

- <https://learnblockchain.cn/docs/ethers.js/api-providers.html>
- <http://zhaozhiming.github.io/2018/04/25/how-to-use-ethers-dot-js/>
