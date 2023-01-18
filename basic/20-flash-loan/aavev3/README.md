[中文](./README-CN.md) / English

# AAVE v3 FlashLoan introduce  

1. Your contract calls the Pool contract, requesting a Flash Loan of a certain amount(s) of reserve(s) using flashLoanSimple() or flashLoan().
2. After some sanity checks, the Pool transfers the requested amounts of the reserves to your contract, then calls executeOperation() on receiver contract .
3. Your contract, now holding the flash loaned amount(s), executes any arbitrary operation in its code.
   1.  If you are performing a flashLoanSimple, then when your code has finished, you approve Pool for flash loaned amount + fee.
   2.  If you are performing flashLoan, then for all the reserves either depending on interestRateMode passed for the asset, either the Pool must be approved for flash loaned amount + fee or must or sufficient collateral or credit delegation should be available to open debt position.
   3.  If the amount owing is not available (due to a lack of balance or approvaln or insufficient collateral for debt), then the transaction is reverted.
4. All of the above happens in 1 transaction (hence in a single ethereum block).


## Steps  
- Install dependencies  
```shell
yarn
```

- Config the envrioument  
```shell
cp .env.example .env
# set INFURA_ID , PRIVATE_KEY, ETHERSCAN_APIKEY in .env
```

- Start flashloan && mint flashLoan  
```shell
npx hardhat run scripts/deploy_aavev3_flashloan.js --network goerli
```

## Reference link  
- Detail of flash loan：https://docs.aave.com/developers/guides/flash-loans
- V3 Testnet Addresses：https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses    
- Get goerli Dai Token: https://goerli.etherscan.io/address/0xdf1742fe5b0bfc12331d8eaec6b478dfdbd31464 
