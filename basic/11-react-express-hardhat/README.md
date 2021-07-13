## Express 结合 hardhat

- 安装依赖

```shell
yarn
```

- 选择创建一个简单的项目。添加一个名为 SimpleToken.sol 的合约到 ./contracts, 编译此合约并且运行测试

```shell
npx hardhat compile
npx hardhat test
```

- 部署

```shell
npx hardhat run scripts/deploy.js --network kovan
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