# LI.FI 介绍  
LI.FI 是一种跨链桥接聚合协议，通过聚合 Bridge, DEX, Solver 来支持 Token 在任意链之间转移，交易。   
应用场景举例如下：    
1）Optim 上的 USDT 转移到 Polygon 上  
2）Optim 上的 USDT 转移到 Polygon 上，同时将 USDT swap 为 USDC   
3）Optim 上的 USDT 转移到 Polygon 上，同时将 10% USDT 变为 Polygon 上原生的 gas ( Matic )，以便后续的操作。这个特性对 EVM 链和非 EVM 链来说非常便利，但目前只支持 4 个链   
4）Optim 上的 USDT 转移到 Polygon 上的同时，调用 Polygon 链上的一个合约进行相应处理 

LI.FI 的操作很简单，用户只需在 origin chain 上发起一笔交易即可完成上述这些场景。  
同时为方便其他 Dapp 集成，LI.FI 提供了对应的 [SDK](https://docs.li.fi/integrate-li.fi-js-sdk/install-li.fi-sdk) 和 相应的前端 [UI components](https://docs.li.fi/integrate-li.fi-widget/li.fi-widget-overview)  

# 跨链测试 
下面我们将使用 ARB 和 OP 这两个 Layer2 演示 USDT 跨链 
- 软件要求 
```
node 版本需要为 v20.11.0
```

- 安装依赖  
``` 
npm install
```

- 配置 env 文件  
```shell
cp .env.example .env
## 之后在 .env 文件中配置对应的私钥和infura
```

- 发起跨链请求 
```
npx hardhat run scripts/1-crossChainTokenTransfer.js --network optim
```

- 检查跨链结果  
```
npx hardhat run scripts/2-checkTokenTransferStatus.js --network optim
```


## 参考文档 
- 官方文档: https://docs.li.fi/  
- 合约仓库: https://github.com/lifinance/contracts/blob/main/docs/README.md  