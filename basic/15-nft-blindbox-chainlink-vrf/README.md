English / [中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/15-nft-blindbox-chainlink-vrf/README-CN.md)
## NFT blind box design based on ChainLink VRF
VRF is a secure verifiable random number on the chain. It is used to generate secure random numbers. For details, see [the ChainLink VRF official documentation](https://docs.chain.link/docs/get-a-random-number).  
This sample code demonstrates how to use ChainLink for NFT blind box design. 

## Operation Process  
- Configure the private key
The private key put in **.env** in the format "PRIVATE_KEY= XXXX ", from which the code automatically reads.

- Get Link test coins 
Every time you go to ChainLink to request VRF random number, you need to consume Link coins. Therefore, you need to apply for Link test coins before the test. For the Goerli test network, go to [Request testnet LINK](https://faucets.chain.link/goerli?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935) , Then "Netwrok" selects "Ethereum Sepolia" , click "Connect wallet" connect with MeatMask", click "Send Request" for geting 25 Test Link
<center><img src="./imgs/Ethereum-Sepolia.png?raw=true" /></center>
<center><img src="./imgs/GetLink.png?raw=true" /></center>

- Install Dependencies
```
npm install 

Node Version：v20.11.0
```

### Generate random number

- Create ChainLink SubscriptionID  
Login [ChainLink VRF Test network](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , Click on "Create Subscription" to Create a SubscriptionID and you can see the created SubscriptionID under "My Subscriptions"
<center><img src="./imgs/CreateSubscription.png?raw=true" /></center>  


- Save SubscriptionID  
Save the SubscriptionID created in the previous step to **.env** 
<center><img src="./imgs/CreateSubscription.png?raw=true" /></center>  

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

- Compile contract
```
npx hardhat compile
```


- Deployment test contract
```
npx hardhat run scripts/deploy.js --network sepolia
```
For different test networks (non-sepolia), please refer to [Chain Link: supported-networks](https://docs.chain.link/vrf/v2/subscription/supported-networks), in ./contracts/RandomNumberVRF.sol Modify the values ​​of vrfCoordinator, link, keyHash

- Add Consumer 
```
Click to enter the already created Subscription, click "Add Consumer" to fill in the contract address returned by deploy in the previous step. After filling in, you need to wait for 10 seconds. At this time, refresh the page and you can see the configured consumer address.

```
<center><img src="./imgs/SubscriptionDetail.png?raw=true" /></center> 
<center><img src="./imgs/AddConsumer.png?raw=true" /></center> 

- Get random number 
```
npx hardhat run scripts/random-number-vrf.js --network sepolia
```
After the requestRandomWords request is sent, it takes a certain amount of time for the ChainLink callback fulfillRandomWords to generate random numbers, which prevents the Main program from ending. Therefore, it is necessary to set up a loop to detect whether the RequestFulfilled event is generated.

- Get randomword again  
```
npx hardhat run scripts/transaction.js --network sepolia
``` 
RandomWords After the random number is generated, it is passed in through the contract. The requestID saved in ./scripts/deployment.json is used to obtain the random number obtained before. You can customize random number usage scenarios. This example is only used as a calling reference.

After the random number is generated, it can be viewed in Ehterscan
<center><img src="./imgs/Consumer.png?raw=true" /></center> 
<center><img src="./imgs/Events.png?raw=true" /></center> 
<center><img src="./imgs/RequestAndResult.png?raw=true" /></center> 

### generate NFT

- Sacking the NFT721 contract
```sh
  npx hardhat run scripts/deployDungeonsAndDragonsCharacter.js --netwrok sepolia
```

- Mint NFT
```sh
  npx hardhat run scripts/blindCharacter.js --netwrok sepolia
```


## Refer to the link
Github sample code:  https://github.com/PatrickAlphaC/dungeons-and-dragons-nft  
Chainlink Reporting Overview of Off-Chain: https://learnblockchain.cn/article/2186  
How to obtain random numbers in NFT(ERC721): https://learnblockchain.cn/article/1776  
Develop a DeFi project in 10 minutes using Chainlink predictor: https://learnblockchain.cn/article/1056  
chainlink goerli faucet: https://faucets.chain.link/goerli?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935  
ChainLink VRF official document: https://docs.chain.link/docs/get-a-random-number/  