[中文](./README-cn.md) / English

# Chainlink CCIP Cross chain Transfer

## Overview  
The Chainlink CCIP provides a straightforward interface through which dApp and web3 entrepreneurs can securely meet all their cross-chain needs. Users can utilize CCIP to transfer data, tokens, or a combination of both.

## How it works    
Users call the Router contract on the source chain to either lock or burn tokens, and then unlock or mint the tokens on the target chain, depending on the specific token transfer needs. For example, ETH cannot be burned on the source chain, so it can only be locked in the token pool and later minted as wrapped WETH on the target chain. However, for USDT, a burn-and-mint approach is used, where USDT is burned on the source chain and the corresponding USDT is minted on the target chain.

The specific process includes three steps:

- The on-chain component on the source domain sends a message.
- The off-chain proof service of Chainlink CCIP signs the message.
- The on-chain component on the destination domain receives the message and forwards the message body to the specified recipient.

## Prepare 
- Install  
```
npm install
```

- Config  
```
cp .env.example .env
## Then configure the correct environment variables in the .env file 
```

- Get test link token 
```
Visit the following website to get test LINK tokens on the Sepolia testnet.
https://faucets.chain.link/
```

- Get CCIP-BnM Test Token 
```
Visit the following website to get CCIP-BnM Test Token on the testnet
https://docs.chain.link/ccip/test-tokens#mint-test-tokens
```

- Obtain test Matic  
```
Visit the following website to obtain test Matic on the Polygon Mumbai
https://faucet.polygon.technology/
```


## Execute cross-chain data transfer.  
- Deploy the Sender contract to Sepolia  
```
npx hardhat run scripts/sendCrossChainData/1-deploySenderOnSepolia.js --network sepolia
```

- Send link tokens to the deployed contract   
```
npx hardhat run scripts/sendCrossChainData/2-transferLinkToSenderOnSepolia.js --network sepoli
```

- Deploy the Receiver contract to Polygon Mumbai  
```
npx hardhat run scripts/sendCrossChainData/3-deployReceiverOnMumbai.js --network mumbai
```

- Send cross-chain data  
```
npx hardhat run scripts/sendCrossChainData/4-sendCrossChainDataOnSepolia_PayByLinkToken.js --network sepolia
```

- Receive cross-chain messages 
```
## Visit https://ccip.chain.link/, enter the transaction hash, make sure that the message has been processed, and then execute the following script
npx hardhat run scripts/sendCrossChainData/5-receiveCrossChainDataOnMumbai.js --network mumbai
```

## Execute Token Cross-Chain   
- Deploy the Transfer contract on Sepolia 
```
npx hardhat run scripts/sendCrossChainToken/1-deployTokenTransferorOnSepolia.js --network sepolia
```  

- Send LINK to the deployed contract 
```
npx hardhat run scripts/sendCrossChainToken/2-transferLinkToTokenTransferorOnSepolia.js --network sepolia
``` 

- Deploy the Transfer contract on Mumbai 
```
npx hardhat run scripts/sendCrossChainToken/3-deployTokenTransferorOnMumbai.js --network mumbai
``` 

- Execute token cross-chain 
```
npx hardhat run scripts/sendCrossChainToken/4-sendCrossChainTokenOnSepolia_PayByLinkToken.js --network sepolia
``` 

- Check the cross-chain result   
```
## Visit https://ccip.chain.link/, enter the transaction hash, confirm that the message has been processed, and then execute the following script
npx hardhat run scripts/sendCrossChainData/5-receiveCrossChainDataOnMumbai.js --network mumbai
```


## Reference 
- Official Documentation: https://docs.chain.link/ccip/tutorials/programmable-token-transfers
- Supported Cross-Chain Token List: https://docs.chain.link/ccip/supported-networks/v1_2_0/mainnet 
