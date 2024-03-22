中文 / [English](./README.md)

## Express 结合 hardhat

- 配置私钥
  在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

- 安装依赖

```shell
yarn

#Node 版本： v20.11.0
```

- 选择创建一个简单的项目。添加一个名为 SimpleToken.sol 的合约到 ./contracts, 编译此合约并且运行测试

```shell
npx hardhat compile
npx hardhat test
```

- 部署

```shell
npx hardhat run scripts/deploy.js --network sepolia
```

- 找到你的本地节点账户的私有 key 以及 token 地址，导入到 Metamask 中

- 后端

```shell
cd backend
yarn
node app.js
```

- 启动 react

```shell
cd frontend
yarn
yarn start
```

## 参考文档

- https://github.com/dzzzzzy/Nestjs-Learning  
- https://docs.nestjs.cn/8/firststeps  
- https://github.com/HeyiMaster/nest-starter nestjs
- https://www.bilibili.com/video/BV1bQ4y1A77L?p=4 netstjs Bilibili
