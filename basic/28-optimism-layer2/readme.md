# Optimism 
## Abstract   
Optimistic Rollups（OR）is a Layer2 solution，which means it's not an independent chain，but relys on Ethereum mainnet。The benefits of such construction are that it can not only run smart contracts at scale，but also enjoys the benefit of Ethereum security，just similar to Plasma，but have less capacity of transactions。OR chooses to use OVM（Optimistic Virtual Machine）compatible with EVM，allowing contracts to have same behavior on both sides.

The name "Opmistic Rollup" comes from the characteristics of the solution itself。 Optimistic means less infomation for aggregator to publish ，and no need to provide any proof。 Rollup means transactions are submitted to L1 in bundles。 

## Test steps   
### ETH cross-chain with Optimism gateway    
- Deposite ETH to Optimistic     
Optimism testnet links to Kovan testnet。 Before we send transactions to Optimistic， we need to deposite ETH to Optimistic first。  
Visit Optimism gateway，then choose "Deposite" ，and input ETH amount     
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/28-optimism-layer2/deposite.png?raw=true" /></center>


- Waiting for deposite finish    
If deposite successfully，you'll see following message on the web page  
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/28-optimism-layer2/deposite_success.png?raw=true" /></center>

- Check Balance    
After ETH deposite successfully，check balance on Optimistic with MetaMask     
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/28-optimism-layer2/balance.png?raw=true" /></center> 

- Install dependencies    
```bash
yarn
```

- Config env parameters     
Use template .env.example to create .env ，then config PRIVATE_KEY && INFURA_ID in it    

- Deploy Contract   
```bash
❯ npx hardhat run scripts/deploy.js --network optimism
Deploying contracts with the account: 0xa3F2Cf140F9446AC4a57E9B72986Ce081dB61E75
Account balance: 1500000000000000000
Token address: 0x0d29e73F0b1AE67e28495880636e2407e41480F2
```

### ETH cross-chain with script       
- Deposite ETH to Optimism with script  
In addition to do cross-chain through UI，we can also do it with script。      
In the following script，by calling cross-chain contract on Kovan side， ETH will be deposited to Optimism。  
```
npx hardhat run scripts/deposit-eth.js --network kovan

## It will takes about 5 minuts to finish the deposite，then it will add 0.0001 ETH to your account on Optimism side  
```

- Withdraw ETH to Kovan       
After deposite ETH to Optimism，we can also withdraw it back to Kovan。  
Similar to deposite，we just call cross-chain contract on Optimism side，ETH will be withdrawed to Kovan。 
```
npx hardhat run scripts/withdraw-eth.js --network optimism

## It will takes about 5 minuts to finish the withdraw，then it will add 0.0001 ETH to your account on Kovan side 
```


## References    
optimism github: https://github.com/ethereum-optimism/optimism-tutorial     
Optimistic Rollup contracts:  https://medium.com/plasma-group/ethereum-smart-contracts-in-l2-optimistic-rollup-2c1cef2ec537      
Optimism Rollup Principle Explanation : https://zhuanlan.zhihu.com/p/350541979    
Optimism Cross Bridge : https://gateway.optimism.io/   
Optimism Kovan deposite proxy contract : https://kovan.etherscan.io/address/0x22f24361d548e5faafb36d1437839f080363982b#code      
Optimism Kovan withdraw proxy contract : https://kovan-optimistic.etherscan.io/address/0x4200000000000000000000000000000000000010   