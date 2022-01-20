## 基于 chainlink vrf的 nft盲盒设计
VRF 为链上安全可验证随机数, 用于安全的生成随机数, 具体可参考 [chainlink vrf官方文档](https://docs.chain.link/docs/get-a-random-number).  
本样例代码演示如何使用 ChainLink 进行 NFT 盲盒设计.  

## 操作步骤  
- 配置私钥  
在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

- 获取 test Link  
每次去 ChainLink 请求 VRF 随机数时, 都需要消耗 Link 币, 所以在测试前需要申请 Link 测试币. 以 Kovan 测试网为例, 前往 [Request testnet LINK](https://faucets.chain.link/kovan?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935) , 然后 "Netwrok" 选择 "Ethereum Kovan", "Testnet account address" 输入 .env 文件中 PRIVATE_KEY 对应的账户地址 
![](./images/chainlink.png)
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/15-nft-blindbox-chainlink-vrf/chainlink.png?raw=true" /></center>

- 安装依赖
```
npm install 
```

- 测试合约
```
npx hardhat run script/deploy.js --network kovan
```

## 脚本逻辑  
```js
    /**
       * Constructor inherits VRFConsumerBase
       *
       * Network: kovan
       * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
       * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
       * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
       */
    const Coordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
    const LINK = "0xa36085F69e2889c224210F603D836748e7dC0088";
    const KeyHash = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
    
    // 部署 DungeonsAndDragonsCharacter 合约
    const dnd = await Dnd.deploy(Coordinator, LINK, KeyHash);

    await dnd.deployed();

    console.log("dnd deployed to:", dnd.address);
    
    /** 在测试开始之前，我们已经在 "aucets.chain.link" 上申请了 test Link 币, 当在合约中调用 requestRandomness 去向 chainLink 申请随机数时，
    *   合约需要向 ChainLink 支付 Link 币, 所以在这里我们向新部署的合约转账部分 test Link 币, 合约调用 requestRandomness 时就可以支付 Link 币
    */
    const token = await hre.ethers.getContractAt("LinkTokenInterface", LINK);
    var exp = ethers.BigNumber.from("10").pow(18);
    await token.transfer(dnd.address, ethers.BigNumber.from("3").mul(exp));
    const bal =  await token.balanceOf(dnd.address);
    console.log("dnd link balance : ", bal.toString());
    
    // 获取 VRF 随机树
    const tx = await dnd.requestNewRandomCharacter(77, "The Chainlink Knight");
```
 

## 参考链接
github 样例代码:  https://github.com/PatrickAlphaC/dungeons-and-dragons-nft  
Chainlink链下报告概览: https://learnblockchain.cn/article/2186  
如何在NFT(ERC721)中获取随机数: https://learnblockchain.cn/article/1776  
使用Chainlink预言机，十分钟开发一个DeFi项目: https://learnblockchain.cn/article/1056  
chainlink kovan faucet: https://faucets.chain.link/kovan?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935  
ChainLink VRF 官网文档: https://docs.chain.link/docs/get-a-random-number/  