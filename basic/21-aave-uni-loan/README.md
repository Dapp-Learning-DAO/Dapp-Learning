# AAVE-Uniswap

## 项目介绍

a simple contract that lets you create and unwind leveraged positions on Aave 👻 by integrating with Uniswap 🦄, plus some testing courtesy of Hardhat👷.
The Aave Ape combines two Defi protocols, Aave (for lending) and Uniswap (for swapping).

**AAVE**
Interacting with Aave starts with the Pool Addresses Provider — this is the source of truth for Aave V3’s latest contract addresses:
- Pool: where the depositing & borrowing happens 🏦
- PoolDataProvider: provides easy-to-access information about reserves & users 📊
- PriceOracle: provides secure price feeds 💱

**uniswap V3**
Interacting with Uniswap V3 all happens through the Uniswap SwapRouter.


**key point**

We can create a constructor that lets us set the two addresses we need (the PoolAddressesProvider and the Router). Once we then have the addresses and the interfaces, we can create helper functions to instantiate contracts so that we can interact with them, and fetch Aave reserve data from the PoolDataProvider.  

Assuming  you have an apeAsset you want to go long and a borrowAsset you want to go short
this ape function lets a user carry out the following steps in one transaction
- Calculate the maximum amount the user is able to borrow in the borrowAsset, based on their collateral (this relies on getAvailableBorrowInAsset)
- Borrow that amount of borrowAsset from Aave V3 on behalf of the user

This requires the user to have delegated credit to the Aave Ape contract, so that it can borrow from Aave on the user’s behalf — see more about Credit Delegation

- Approve the borrowAsset for trading on Uniswap
- Swap the borrowAsset for the maximum available amount of the apeAsset via Uniswap V3
- Deposit the apeAsset back into Aave on behalf of the user


**unwindApe**
Borrow the amount needed to repay their borrowAsset debt via a flashloan from Aave V3.   
For more detail , please visit [aave-ape](https://azfuller20.medium.com/aave-ape-with-%EF%B8%8F-scaffold-eth-c687874c079e )
## operating steps

```shell
// depoly aaveape
npx hardhat ignition deploy ./ignition/modules/AaveApe.js --network  matic
 

// contract verify
npx hardhat verify --network matic 0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb" "0xE592427A0AEce92De3Edee1F18E0157C05861564"

// open maxposition on aave
npx hardhat run --network matic scripts/loan.js   

```




## 参考链接
- aave-ape medium : https://azfuller20.medium.com/lend-with-aave-v2-20bacceedade
- hardhat forkmainnet : https://hardhat.org/hardhat-network/guides/mainnet-forking.html
- quick swap: https://github.com/QuickSwap
- uniswapper : https://azfuller20.medium.com/swap-with-uniswap-wip-f15923349b3d
- uniswap v3 swap : https://solidity-by-example.org/defi/uniswap-v3-swap/
- https://github.com/austintgriffith/scaffold-eth/tree/defi-rtokens  
- https://github.com/austintgriffith/scaffold-eth/tree/unifactory  
- https://github.com/austintgriffith/scaffold-eth/tree/clr-dev  
- https://medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da 
- aave official doc: https://docs.aave.com/developers/getting-started/contracts-overview  
- aave polygon graph: https://thegraph.com/hosted-service/subgraph/aave/protocol-v3-polygon 
- scaffold chanllenge https://medium.com/@austin_48503/%EF%B8%8Fethereum-dev-speed-run-bd72bcba6a4c
- scaffold-eth task: https://speedrunethereum.com/ 
- aave flashloan: https://github.com/johngrantuk/aaveFlashLoan  
- axios query subgraph: https://gist.github.com/alejoacosta74/55044445dec594f33c10c432b39f1116  
- aave deployed contract addresses: https://docs.aave.com/developers/deployed-contracts/v3-mainnet
- uniswap deployed contract addresses: https://docs.uniswap.org/contracts/v3/reference/deployments   
