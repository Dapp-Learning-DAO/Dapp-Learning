[中文](./README-CN.md) / English

# AAVE v3 FlashLoan introduce  

1. Your contract calls the Pool contract, requesting a Flash Loan of a certain amount(s) of reserve(s) using flashLoanSimple() or flashLoan().
2. After some sanity checks, the Pool transfers the requested amounts of the reserves to your contract, then calls executeOperation() on receiver contract .
3. Your contract, now holding the flash loaned amount(s), executes any arbitrary operation in its code.
   1.  If you are performing a flashLoanSimple, then when your code has finished, you approve Pool for flash loaned amount + fee.
   2.  If you are performing flashLoan, then for all the reserves either depending on interestRateMode passed for the asset, either the Pool must be approved for flash loaned amount + fee or must or sufficient collateral or credit delegation should be available to open debt position.
   3.  If the amount owing is not available (due to a lack of balance or approvaln or insufficient collateral for debt), then the transaction is reverted.
4. All of the above happens in 1 transaction (hence in a single ethereum block).

## explanatory of logical of flash loan smart contract  
### Flashloan illustrate  
let's get into `contracts/SimpleFlashLoan.sol`  (aave version 3)
```solidity

import "https://github.com/aave/aave-v3-core/blob/master/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "https://github.com/aave/aave-v3-core/blob/master/contracts/interfaces/IPoolAddressesProvider.sol";
import "https://github.com/aave/aave-v3-core/blob/master/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

constructor(address _addressProvider) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
   
       owner = payable(msg.sender);
   }


```  

This is a necessary dependency for importing, and the Flashloan contract inherits from the `FlashLoanSimpleReceiverBase`. It is an abstract contract that provides some useful methods, such as repaying flash loans.

The SimpleFlashloan.sol constructor accepts the address of a loan pool from Aave (configured with the corresponding PoolAddressesProvider in the deploy.aave-flashloan.js script).

Create a variable owner for the address type (some codes do not set this owner, which means everyone can call the contract) and make it payable.

Aave v3 has simplified some methods, so some method names have the `Simple` keyword added after them

The name of the aave v3 contract has changed compared to v1 (in fact, it still calls the old contract internally, which may be because the previous name is too long and difficult to remember, so it has been modified). Please refer to [AAVEf: supported networks](https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses)

This article takes the Sepolia test network as an example and selects `Ethereum Sepolia`. For different test networks, the corresponding `PoolAddressesProvider` needs to be configured in the `deploy_1ave_flashloan.js` script
<center><img src="./img/aave-v3-namechange.png?raw=true" /></center> 
<center><img src="./img/sepolia-testnet.png?raw=true" /></center> 


### The flashloan function  
The core of the requestFlashLoan method is to call POOL. flashLoanSimple(), where the POOL variable is defined in FlashLoanSimpleReceiverBase, it is an instance of IPool
```solidity
function flashLoanSimple(
    address receiverAddress,
    address asset,
    uint256 amount,
    bytes calldata params,
    uint16 referralCode
  ) external;

```
The following is the definition in the FlashLoanSimpleReceiverBase contract (a rough understanding is sufficient)

```solidity
abstract contract FlashLoanSimpleReceiverBase is IFlashLoanSimpleReceiver {
  IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
  IPool public immutable override POOL;

  constructor(IPoolAddressesProvider provider) {
    ADDRESSES_PROVIDER = provider;
    POOL = IPool(provider.getPool());
  }

```

Start the SimpleFlashLoan contract by connecting to Aave's FlashLoanSimpleReceiverBase contract

The parameter 'asset' of requestFlashLoan is the asset address where we want to borrow using Flash Loan, such as ETH, DAI, or USDC.
<center><img src="./img/token_address.png?raw=true" /></center> 


`uint amount = 1 ether;`
In here, we define the loan count unit as `ether`, if we pass the ETH address in, we will take loan 1 ETH , thus 10^18 wei. And if we send DAI address to `_asset`, we will get loan 1 DAI! 

There are two parameters that we will not use but are required by the Aave contract.

Params       - Additional information about loans, such as messages or phrases
ReferralCode - I currently do not understand the meaning of this parameter

The addressProvider variable inside FlashLoanSimpleReceiverBase will be passed into the IPoolAddressesProvider interface, where the getPool() function will be called, which will return the address of the proxy pool (the contract that implements all functions of flash lending).

And all of this will be saved in the POOL variable, which needs to be wrapped in the IPOOL interface like our address in order to access the Proxy Pool function of the contract.

### The executeOperation function
```solidity
   function executeOperation(
    address asset, 
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
   ) external override returns(bool){
     str = "New Logic in FlashLoans";

        //
        // Your logic goes here.
        // !! Ensure that *this contract* has enough of `_reserve` funds to payback the `_fee` !!
        //
     uint256 totalAmount = amount + premium;
     IERC20(asset).approve(address(POOL),totalAmount);
     return true; 

   }

}
```

When we triggered valid flashloan with `flashLoan` function, the all paramaters in `executeOperation` will be passed automatically

Then, we can insert any logical we want to excute. In this step, we had have all usable fund from flashloan, and we can use it to have a arbitrage.

After we used flashloan, it's repay time.

`uint totalAmount = amount + premium`

In here, we need caculate how much we need repay, which is **loan amount + 0.05% of loan amount (Borrowing charge of Aave flashloan)** , Premium can also be set to a fixed amount * 0.05%.

The final step is calling `IERC20(asset).approve(address(POOL),totalAmount)` to repay the flashloan.

## AAVE FAUCET
Our smart contract requires some Testnet USDC (using USD C as the loan currency in this article) to pay the interest on Flash Loan. Go to Aave's faucet, select Ethereum Market, connect to MetaMask, and click on Faucet near USDC to obtain USDC.
<center><img src="./img/aave_faucet.png?raw=true" /></center> 

## Steps
- Install dependencies
```shell
# Node version v20.11.0
npm init 
npm install --save-dev hardhat
npx hardhat
npm install --save-dev "hardhat@^2.21.0" "@nomicfoundation/hardhat-toolbox@^2.0.0"
```

- Config the params of envrioument  
```shell
cp .env.example .env
# set INFURA_ID , PRIVATE_KEY in .env
```

- Deploy the contract 
```shell
# we use test net sepolia to have test
npx hardhat run scripts/deploy_aave_flashloan.js --network sepolia
```
After the transaction is completed, log in to [Etherscan](https://sepolia.etherscan.io/) based on the printed Transaction hash view transaction details
<center><img src="./img/etherscan_query.png?raw=true" /></center> 
<center><img src="./img/transaction_detail.png?raw=true" /></center> 

Congratulations on executing the flash loan; You borrowed an unsecured loan. In this guide, we learned about Flash Loan, created and deployed the Aave V3 Flash Loan contract, borrowed some unsecured tokens, and charged interest fee refunds
## Reference link  
- Detail of flash loan：https://docs.aave.com/developers/guides/flash-loans
- V3 Testnet Addresses：https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses    
- Get goerli Dai Token: https://goerli.etherscan.io/address/0xdf1742fe5b0bfc12331d8eaec6b478dfdbd31464 
