
## auction-exchange
 nft 资产拍卖
 - 支持定价出售
 - 支持拍卖
 

## 操作步骤  
- 配置私钥  
在 .env 中放入的 如下配置，格式如下:
```
INFURA_ID=yyyyyyyy
PRIVATE_KEY_MAIN=xxxxx
PRIVATE_KEY_ALICE=yyyyy
PRIVATE_KEY_BOB=ttttt
PRIVATE_KEY_TEST=zzzzz
```

- 启动hardhat node  
npx hardhat node --network hardhat

- 启动ipfs  
ipfs daemon

- 部署合约  
npx hardhat run scripts/upload.js --network localhost
npx hardhat run scripts/react_app_contract.js --network localhost

- 配置参数  
react 启动的时候会做一些校验, 这些校验会导致 react 启动失败, 所以这里需要进行下配置跳过这些不必要的检查.
在 .sample.env 配置中已经进行了配置, 这里只需要把配置文件复制下即可.  
```
cd react-app
cp .env.example .env
```

- 启动前端  
```
yarn install
yarn start
```

- MetaMask 链接本地节点  
切换 MetaMask 账户链接网路为 localhost

- 登录 react 页面   
打开 react 页面, 默认为 http://localhost:3000

- Faucet 注意资金  
点击页面右上交的 "Faucet" 按钮就可以注入初始资金, 用于后续拍卖

- Mint 资产  
react 页面点击图片下面的 "Mint" 按钮, 生产 ERC721 资产, 之后可以在 "yourcollectibles" 查看归属于你的资产

- 进行拍卖  
Mint 之后, 在图片下面会出现 "Start Auction" 的按钮, 点击按钮就可以开始拍卖, 有两种拍卖方式, "Auction Fixed Price" 和 "Auction Unfixed Price", 这里可以选择 "Auction Fixed Price" 进行拍卖 ( 进行 Auction 以后，你会发现 "yourcollectibles" 中属于你的资产消失了 )

- 切换账户  
切换 MetaMask 到另一个账户, 页面会进行刷新. 这里刷新可能有点慢, 需要耐性等待一下, 直到右上角账户显示为新账户.  

- 进行竞价购买  
使用新的账户, 对 Auction 的图片进行 Bid , 成功购买之后, 可以在 "yourcollectibles" 中查看购买到的资产


 ## 合约测试步骤：
- 执行单元测试   
AuctionFixedPrice.sol : 定价拍卖  
AuctionUnfixedPrice.sol 不定价拍卖
```
npx hardhat test
```

- 执行 script 下的脚本    
```  
npx hardhat run scripts/auction-fix-price-script.js --network kovan
```



## 参考链接
 https://medium.com/coinmonks/how-to-implement-an-erc721-market-f805959ddcf  
 https://docs.matic.network/docs/develop/advanced/swap-assets    
 https://github.com/ethers-io/ethers.js/issues/368    
 虚拟机节点时间戳问题：
 https://ethereum.stackexchange.com/questions/86633/time-dependent-tests-with-hardhat  
 Opensea 使用的 Wyvern Protocol: https://github.com/wyvernprotocol/wyvern-v3

 https://explorer-mainnet.maticvigil.com/address/0x8d1566569d5b695d44a9a234540f68D393cDC40D/contracts  
 https://github.com/ssteiger/Ethereum-NFT-Store-with-Dutch-Auctions  
荷兰拍卖：
https://medium.com/@shopevery/building-smart-contracts-for-a-dutch-auction-part-1-81dc5c770f1f
https://corporatefinanceinstitute.com/resources/knowledge/finance/dutch-auction/


## Todo List

### 管理页面
- NFT生成页
- 我的NFT列表页
- 发起拍卖操作对话框
- 发起拍卖列表页
- 出价记录列表页

### 前端页面
- 主页
- About
- NFT列表页
- 拍卖列表页
- 出价对话框

### 异常页面
- 确实账号时, Metamask调起页面
- 没有MetaMask, MetaMask下载页面

### 未确定

- Collection功能
- 个人资料功能