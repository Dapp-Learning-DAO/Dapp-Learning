## 众筹合约

本样例演示众筹合约的基本流程，包括部署合约，合约，启动众筹项目，

## 操作流程

- 配置私钥  
  在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

- 安装依赖

```bash
yarn
```

- 编译合约

```bash
npx hardhat compile
```

- 测试合约

```bash
npx hardhat test
```

- 部署合约

```bash
npx hardhat run scripts/deploy_crowdfunding.js --network rinkeby
```

## Crowdsale 类型

- CappedCrowdsale
- IndividuallyCappedCrowdsale
- TimedCrowdsale
- WhitelistedCrowdsale
- FinalizableCrowdsale
- PostDeliveryCrowdsale
- RefundableCrowdsale
- AllowanceCrowdsale
- MintedCrowdsale
- IncreasingPriceCrowdsale

## 参考链接

- https://medium.com/openberry/creating-a-simple-crowdfunding-dapp-with-ethereum-solidity-and-vue-js-69ddb8e132dd  
- https://medium.com/extropy-io/crowdsales-on-ethereum-with-openzeppelin-57bbdea95390  
- https://www.programmersought.com/article/1396206575/  
- https://github.com/OpenZeppelin/openzeppelin-contracts/tree/release-v2.3.0/contracts/crowdsale
