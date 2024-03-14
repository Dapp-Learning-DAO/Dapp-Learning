# Chainlink CCIP 跨链
中文 / [English](./README.md)  

## 概览 
Chainlink CCIP 提供了一个简单的接口，dApp 和 web3 企业家可以通过它安全地满足他们所有的跨链需求。用户可以使用 CCIP 传输数据，代币，或是二者一起传输。 

## 原理   
用户调用源链上的 Router 合约，将代币 lock 或 burn ，然后在目标链上将代币 unlock 或 mint 出来，具体取决于需要 Transfer 的代币。比如 ETH，它不能在源链上被 burn, 所以只能被 lock 在代币池中，之后在目标链上 mint 出包装后的 WETH。但是对于 USDT，则采用 burn and mint 的方式，即在源链上 burn 掉 USDT，然后在目标链上 mint 出对应的 USDT。   

具体过程包括三个步骤：

源域上的链上组件发出消息。
Chainlink CCIP 的链下证明服务对消息进行签名。
目的域上的链上组件接收消息，并将消息体转发给指定的接收者。

## 准备测试环境  
- 安装依赖  
```
npm install
```

- 配置 env 
```
cp .env.example .env
## 然后在 .env 中配置正确的环境变量 
```

- 获取测试 link token 
```
访问如下 web 获取 sepolia 测试网测试 link token
https://faucets.chain.link/
```

- 获取测试 CCIP-BnM Token 
```
访问如下 web 获取 CCIP-BnM 测试 token
https://docs.chain.link/ccip/test-tokens#mint-test-tokens
```

- 获取测试 Polygon Mumbai 测试 Matic 
```
访问如下 web 获取 Polygon Mumbai 测试网测试 Matic
https://faucet.polygon.technology/
```


## 执行跨链 Data 传输 
- 部署 Sender 合约到 Sepolia 
```
npx hardhat run scripts/sendCrossChainData/1-deploySenderOnSepolia.js --network sepolia
```

- 发送 link token 到部署的合约  
```
npx hardhat run scripts/sendCrossChainData/2-transferLinkToSenderOnSepolia.js --network sepoli
```

- 部署 Receiver 合约到 Polygon Mumbai 
```
npx hardhat run scripts/sendCrossChainData/3-deployReceiverOnMumbai.js --network mumbai
```

- 发送跨链 Data 
```
npx hardhat run scripts/sendCrossChainData/4-sendCrossChainDataOnSepolia_PayByLinkToken.js --network sepolia
```

- 接受跨链消息 
```
## 访问 https://ccip.chain.link/，输入 tx hash, 确认消息已经处理完毕后，再执行以下脚本
npx hardhat run scripts/sendCrossChainData/5-receiveCrossChainDataOnMumbai.js --network mumbai
```

## 执行 Token 跨链  
- 在 sepolia 上部署 Transfer 合约
```
npx hardhat run scripts/sendCrossChainToken/1-deployTokenTransferorOnSepolia.js --network sepolia
```  

- 发送 link 到部署的合约上
```
npx hardhat run scripts/sendCrossChainToken/2-transferLinkToTokenTransferorOnSepolia.js --network sepolia
``` 

- 在 mumbai 上部署 Transfer 合约
```
npx hardhat run scripts/sendCrossChainToken/3-deployTokenTransferorOnMumbai.js --network mumbai
``` 

- 执行 token 跨链
```
npx hardhat run scripts/sendCrossChainToken/4-sendCrossChainTokenOnSepolia_PayByLinkToken.js --network sepolia
``` 

- 检查跨链结果  
```
## 访问 https://ccip.chain.link/，输入 tx hash, 确认消息已经处理完毕后，再执行以下脚本
npx hardhat run scripts/sendCrossChainData/5-receiveCrossChainDataOnMumbai.js --network mumbai
```


## 参考文档 
- 官方 doc: https://docs.chain.link/ccip/tutorials/programmable-token-transfers
- 支持的跨链 token list: https://docs.chain.link/ccip/supported-networks/v1_2_0/mainnet 
