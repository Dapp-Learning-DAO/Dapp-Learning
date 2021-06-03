
## auction-exchange
 - 支持定价出售
 - 支持拍卖
 
 ## 操作步骤：
 
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
  