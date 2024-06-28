[中文](./README-CN.md) / English

# hardhat-react

## Preface

The important part of developing Dapp is the front end. The sample will use hardhat combined with react and MetaMask to show how to develop Dapp front end page, the process of developing and the calling of interface. Developers will get the point of the sample code when they have ability to use react.

Put your private key in .env for easy access, formatted with "PRIVATE_KEY=xxxx".

## Steps

1. Install dependencies

   ```sh
   npm install
   ```

2. Deploy contracts

   ```sh
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. Startup react

   ```sh
   cd frontend
   npm install
   npm start
   ```

4. Try to init a ERC20 transaction in the page and watch the change of account tokens balance.

## Reference

- <https://github.com/Fankouzu/smart-contract/tree/master/Solidity%20Lesson%2005>
- <https://create-react-app.dev/docs/getting-started/>
- <https://github.com/nomiclabs/hardhat-hackathon-boilerplate>
- <https://www.nextjs.cn>
