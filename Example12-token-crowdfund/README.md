## 众筹合约
本样例演示众筹合约的基本流程，包括部署合约，合约，启动众筹项目，

## 操作流程
- 安装依赖
```
yarn
```

- 编译合约
```
npx hardhat compile
```

- 测试合约
```
npx hardhat test
```

- 部署合约
```
npx hardhat run scripts/deploy_crowdfunding.js --network kovan
```

### 属性

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
https://medium.com/openberry/creating-a-simple-crowdfunding-dapp-with-ethereum-solidity-and-vue-js-69ddb8e132dd  
https://medium.com/extropy-io/crowdsales-on-ethereum-with-openzeppelin-57bbdea95390  
https://www.programmersought.com/article/1396206575/  
https://github.com/OpenZeppelin/openzeppelin-contracts/tree/release-v2.3.0/contracts/crowdsale  
