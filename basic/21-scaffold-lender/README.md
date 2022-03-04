# AAVE-Uniswap

## 项目介绍

a simple contract that lets you create and unwind leveraged positions on Aave 👻 by integrating with Uniswap 🦄, plus some testing courtesy of Hardhat👷.
The Aave Ape combines two Defi protocols, Aave (for lending) and Uniswap (for swapping).

**AAVE**
Interacting with Aave starts with the Lending Pool Addresses Provider — this is the source of truth for Aave V2’s latest contract addresses:
- LendingPool: where the depositing & borrowing happens 🏦
- ProtocolDataProvider: provides easy-to-access information about reserves & users 📊
- PriceOracle: provides secure price feeds 💱

**uniswapv2**
Interacting with Uniswap V2 all happens through the Uniswap Router02.


**key point**

We can create a constructor that lets us set the two addresses we need (the AddressesProvider and the Router). Once we then have the addresses and the interfaces, we can create helper functions to instantiate contracts so that we can interact with them, and fetch Aave reserve data from the ProtocolDataProvider.  

Assuming  you have an apeAsset you want to go long and a borrowAsset you want to go short
this ape function lets a user carry out the following steps in one transaction
- Calculate the maximum amount the user is able to borrow in the borrowAsset, based on their collateral (this relies on getAvailableBorrowInAsset)
- Borrow that amount of borrowAsset from Aave V2 on behalf of the user

This requires the user to have delegated credit to the Aave Ape contract, so that it can borrow from Aave on the user’s behalf — see more about Credit Delegation

- Approve the borrowAsset for trading on Uniswap
- Swap the borrowAsset for the maximum available amount of the apeAsset via Uniswap V2
- Deposit the apeAsset back into Aave on behalf of the user


**unwindApe**
Borrow the amount needed to repay their borrowAsset debt via a flashloan from Aave V2.  
## operating steps

```shell
// depoly aaveape
hardhat run --network matic scripts/deploy.js   

// contract verify
npx hardhat verify --network matic 0xddb2d92d5a0EDcb03c013322c7BAe92734AA4597 "0xd05e3E715d945B59290df0ae8eF85c1BdB684744" "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"

// open maxposition on aave
hardhat run --network matic scripts/loan.js   

```




## 参考链接
- aave-ape medium : https://azfuller20.medium.com/lend-with-aave-v2-20bacceedade
- hardhat forkmainnet : https://hardhat.org/hardhat-network/guides/mainnet-forking.html
- quick swap: https://github.com/QuickSwap
- uniswapper : https://azfuller20.medium.com/swap-with-uniswap-wip-f15923349b3d
- https://github.com/austintgriffith/scaffold-eth/tree/defi-rtokens  
- https://github.com/austintgriffith/scaffold-eth/tree/unifactory  
- https://github.com/austintgriffith/scaffold-eth/tree/clr-dev  
- https://medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da 
- aave official doc: https://docs.aave.com/developers/the-core-protocol/protocol-overview#main-contracts 
- aave polygon graph: https://thegraph.com/legacy-explorer/subgraph/aave/aave-v2-matic  
- scaffold chanllenge https://medium.com/@austin_48503/%EF%B8%8Fethereum-dev-speed-run-bd72bcba6a4c
- scaffold-eth task: https://speedrunethereum.com/ 
- aave flashloan: https://github.com/johngrantuk/aaveFlashLoan