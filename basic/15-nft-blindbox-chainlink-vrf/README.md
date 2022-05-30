English / [中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/15-nft-blindbox-chainlink-vrf/README-CN.md)
## NFT blind box design based on ChainLink VRF
VRF is a secure verifiable random number on the chain. It is used to generate secure random numbers. For details, see [the ChainLink VRF official documentation](https://docs.chain.link/docs/get-a-random-number).  
This sample code demonstrates how to use ChainLink for NFT blind box design. 

## Operation Process  
- Configure the private key
The private key put in **.env** in the format "PRIVATE_KEY= XXXX ", from which the code automatically reads.

- Get Link test coins 
Every time you go to ChainLink to request VRF random number, you need to consume Link coins. Therefore, you need to apply for Link test coins before the test. For the Kovan test network, go to [Request testnet LINK](https://faucets.chain.link/kovan?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935) , Then "Netwrok" selects "Ethereum Kovan" and "Testnet Account Address "enters the account address corresponding to PRIVATE_KEY in the **.env** file
![](./images/chainlink.png)
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/15-nft-blindbox-chainlink-vrf/chainlink.png?raw=true" /></center>

- Install Dependencies
```
npm install 
```

- Create ChainLink SubscriptionID  
Login [ChainLink VRF Test network](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , Click on "Create Subscription" to Create a SubscriptionID and you can see the created SubscriptionID under "My Subscriptions"
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ChainLinkVRF.png?raw=true" /></center> 


- Save SubscriptionID  
Save the SubscriptionID created in the previous step to **.env** 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/SubscriptionID.png?raw=true" /></center>

```sh
## .env
SubscriptionId=ddddd
```

- Configuring Environment Variables 
**.env** file into the private key and infura node ID 

```sh
## .env
PRIVATE_KEY=xxxxxxxxxxxxxxxx
INFURA_ID=yyyyyyyy
```

- Deployment test contract
```
npx hardhat run scripts/deploy.js --network rinkeby
```

- Get random number 
```
npx hardhat run scripts/random-number-vrf.js --network rinkeby
```

- Generate random Character  
```
npx hardhat run scripts/transaction.js --network rinkeby
``` 

## Refer to the link
Github sample code:  https://github.com/PatrickAlphaC/dungeons-and-dragons-nft  
Chainlink Reporting Overview of Off-Chain: https://learnblockchain.cn/article/2186  
How to obtain random numbers in NFT(ERC721): https://learnblockchain.cn/article/1776  
Develop a DeFi project in 10 minutes using Chainlink predictor: https://learnblockchain.cn/article/1056  
chainlink kovan faucet: https://faucets.chain.link/kovan?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935  
ChainLink VRF official document: https://docs.chain.link/docs/get-a-random-number/  