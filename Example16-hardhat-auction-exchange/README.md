
## auction-exchange
 nft 资产拍卖
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

 https://explorer-mainnet.maticvigil.com/address/0x8d1566569d5b695d44a9a234540f68D393cDC40D/contracts  
 https://github.com/ssteiger/Ethereum-NFT-Store-with-Dutch-Auctions  
荷兰拍卖：
https://medium.com/@shopevery/building-smart-contracts-for-a-dutch-auction-part-1-81dc5c770f1f
https://corporatefinanceinstitute.com/resources/knowledge/finance/dutch-auction/