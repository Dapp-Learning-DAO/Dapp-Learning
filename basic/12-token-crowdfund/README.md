English / [中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/12-token-crowdfund/README-CN.md)
## Crowdfunding Contract
This sample demonstrates the basic process of a crowdfunding contract, including the deployment of the contract, the contract, and the launch of a crowdfunding project.

## Operation Process

- Config **.env**

```sh
cp .env.example .env

## Modify .env to the actual values of INFURA_ID and PRIVATE_KEY
PRIVATE_KEY=xxxxxxxxxxxxxxxx
INFURA_ID=yyyyyyyy
```

- Install Dependencies

```bash
npm install
```

- Compile Contract

```bash
npx hardhat compile
```

- Test Contract

```bash
npx hardhat test
```

- Deploy Contract

```bash
npx hardhat run scripts/deploy_crowdfunding.js --network sepolia
```

## Crowdsale Type

- CappedCrowdsale
- IndividuallyCappedCrowdsale
- TimedCrowdsale
- WhitelistedCrowdsale
- FinalizableCrowdsale
- PostDeliveryCrowdsale
- RefundableCrowdsale
- AllowanceCrowdsale
- MintedCrowdsale
- IncreasingPriceCrowdsale

## Refer to the link

- https://medium.com/openberry/creating-a-simple-crowdfunding-dapp-with-ethereum-solidity-and-vue-js-69ddb8e132dd  
- https://medium.com/extropy-io/crowdsales-on-ethereum-with-openzeppelin-57bbdea95390  
- https://www.programmersought.com/article/1396206575/  
- https://github.com/OpenZeppelin/openzeppelin-contracts/tree/release-v2.3.0/contracts/crowdsale
- Linear Unlock： https://cloud.tencent.com/developer/article/1182701
