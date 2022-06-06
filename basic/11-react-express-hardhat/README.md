[中文](./README-CN.md) / English

## Express combined with hardhat

- Configure private key
  Enter private key in .env, formatted with "PRIVATE_KEY=xxxx"

- Install dependencies

```shell
yarn
```

- Create a simple project selected. Add contract names SimpleToken.sol to ./contracts and compile the contract to run testing.

```shell
npx hardhat compile
npx hardhat test
```

- Deploy

```shell
npx hardhat run scripts/deploy.js --network kovan
```

- Find your private key and address of token in your local node's account, imported to Metamask

- Backend

```shell
cd backend
yarn
node app.js
```

- Startup react

```shell
cd frontend
yarn
yarn start
```

## References

- https://github.com/dzzzzzy/Nestjs-Learning  
- https://docs.nestjs.cn/8/firststeps  
- https://github.com/HeyiMaster/nest-starter nestjs
- https://www.bilibili.com/video/BV1bQ4y1A77L?p=4 netstjs Bilibili
