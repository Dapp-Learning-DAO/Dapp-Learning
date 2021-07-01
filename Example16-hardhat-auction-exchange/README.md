
## auction-exchange
 nft 资产拍卖
 - 支持定价出售
 - 支持拍卖
 

## 操作步骤

- 启动hardhat node  
npx hardhat node --network hardhat

- 启动ipfs  
ipfs daemon

- 部署合约  
npx hardhat run scripts/upload.js --network localhost
npx hardhat run scripts/react_app_contract.js --network localhost

- 启动前端  
yarn install
yarn start

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


 ## 测试步骤：
 
  1. 新建sk-alice.txt, sk-bob.txt文件；存储私钥  
  
  2 功能AuctionFixedPrice.sol 定价拍卖    AuctionUnfixedPrice.sol 不定价拍卖。  
    npx hardhat test   
   
  3 script下有相应合约测试代码。  
    npx hardhat run scripts/auction-fix-price-script.js --network kovan



## 参考链接
 https://medium.com/coinmonks/how-to-implement-an-erc721-market-f805959ddcf  
 https://docs.matic.network/docs/develop/advanced/swap-assets    
 https://github.com/ethers-io/ethers.js/issues/368    
 虚拟机节点时间戳问题：
 https://ethereum.stackexchange.com/questions/86633/time-dependent-tests-with-hardhat  

 https://explorer-mainnet.maticvigil.com/address/0x8d1566569d5b695d44a9a234540f68D393cDC40D/contracts  
 https://github.com/ssteiger/Ethereum-NFT-Store-with-Dutch-Auctions  
荷兰拍卖：
https://medium.com/@shopevery/building-smart-contracts-for-a-dutch-auction-part-1-81dc5c770f1f
https://corporatefinanceinstitute.com/resources/knowledge/finance/dutch-auction/