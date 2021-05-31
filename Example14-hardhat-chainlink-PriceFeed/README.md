# Chainlink 介绍 
Chainlink是去中心化的預言機(Oracle)系統，負責將鏈外資訊傳遞給區塊鏈上的智能合約(Smart contract)，是區塊鏈與現實世界的資訊橋樑。目前區塊鏈跟現實世界以及大部分的區塊鏈上的資訊都無法互通，所以當智能合約要使用本鏈上沒有的資訊時就需要預言機來幫忙取得正確資訊，確保智能合約的正常運行。

参考文档：
https://zh.chain.link/
https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ
https://docs.chain.link/docs/ethereum-addresses/

# 测试流程 
### 安装依赖
```
npm install 
```

### 执行测试脚本 
```
npx hardhat run scripts/deploy.js --network kovan
```
//todo
 增加聚合方式获取。
 