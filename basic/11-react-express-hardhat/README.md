[中文](./README-CN.md) / English

## Express combined with hardhat

- Configure private key
  Enter private key in .env, formatted with "PRIVATE_KEY=xxxx"

- Install dependencies

```shell
yarn

#Node Version: v20.11.0
```

- Create a simple project selected. Add contract names SimpleToken.sol to ./contracts and compile the contract to run testing.

```shell
npx hardhat compile
npx hardhat test
```

- Deploy

```shell
npx hardhat run scripts/deploy.js --network goerli
```

- Find your private key and address of token in your local node's account, imported to Metamask

- Backend

```shell
cd backend
yarn
node app.js
```

- Startup react （open new terminal)

```shell
cd frontend
#Please ensure that it is already present the HARDHAT_NETWORK_ ID in src/components/Dapp.js has been modified to the corresponding network ID
yarn
yarn start
```

## References

- https://github.com/dzzzzzy/Nestjs-Learning  
- https://docs.nestjs.cn/8/firststeps  
- https://github.com/HeyiMaster/nest-starter nestjs
- https://www.bilibili.com/video/BV1bQ4y1A77L?p=4 netstjs Bilibili
