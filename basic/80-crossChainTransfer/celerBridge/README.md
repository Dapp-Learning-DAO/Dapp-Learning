[中文](./README-cn.md) / English

# Celer Bridge 

## Overview
cBridge introduces the best cross-chain token bridging experience, providing users with deep liquidity, efficient and easy-to-use liquidity management for cBridge node operators and liquidity providers who do not want to operate cBridge nodes. It also offers exciting developer-oriented features such as a universal message bridging for scenarios like cross-chain DEX and NFT.

cBridge has two bridge modes, one is Pool-Based, and the other is Canonical Mapping.
Pool-Based involves locking the same token on both Chain A and Chain B, taking USDT as an example. When a user needs to cross from Chain A to Chain B, they first deposit USDT into the Vault on Chain A, and then transfer the USDT to the user on Chain B. In this case, pools need to be established on Chain A and Chain B respectively to complete this operation. When the funds in the pool are insufficient, it may result in an inability to bridge. This mode is known as lock/unlock.
Canonical Mapping corresponds to lock/mint. When a user bridges, they lock USDT into the vault on Chain A, and then mint the corresponding asset to the user on Chain B. Conversely, when a user wants to bridge USDT from Chain B back to Chain A, they burn the USDT on Chain B, and then transfer the USDT from the vault to the user on Chain A.

This test will be conducted on the OP mainnet and Polygon mainnet.

## Test Environment Requirements
The node version needs to be v18.17.0, you can use nvm to switch to the current node version.


## Preparing the Testing Environment 
- Install dependencies   
```
npm install
```

- Configure the environment   
```
cp .env.example .env
## Then configure the specific private key in .env 
```

## Executing Cross-Chain Operations    
- Cross-chain operation in Pool-Based mode       
```
npx hardhat run scripts/1-poolBasedTransfer.js --network optim
```

- Check the cross-chain results     
```
npx hardhat run scripts/2-queryPoolBasedTrasnferStatus.js --network optim
```

- Cross-chain operation in the mapping mode    
```
npx hardhat run scripts/3.1-canonicalTokenTransfer.js --network optim
```

- Check the cross-chain results     
It takes approximately 15 minutes to confirm the final cross-chain status. You can wait for 15 minutes before querying the results. 
```
npx hardhat run scripts/4.1-queryCanonicalTrasnferStatus.js --network optim
```

## Cross-Chain Refund  
When a cross-chain operation fails, users can refund their assets. The following tests demonstrate how to initiate a refund.  

- Cross-chain operation using the mapping method    
```
## For testing purposes, this cross-chain operation will fail, and the OP token will be unlocked, preparing for the subsequent refund. 
npx hardhat run scripts/3.2-canonicalTokenTransfer_ForRefund.js --network optim
```

- Check the cross-chain results     
It takes approximately 15 minutes to confirm the final cross-chain status. You can wait for 15 minutes before querying the results.  
```
npx hardhat run scripts/4.2-queryCanonicalTrasnferStatus_ForRefund.js --network optim
```

- Refund   
```
npx hardhat run scripts/5-canonicalTrasnferRefund.js --network optim
```

## Reference Documentation  
- Official doc: https://cbridge-docs.celer.network/  