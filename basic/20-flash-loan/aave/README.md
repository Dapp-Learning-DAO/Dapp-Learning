[中文](./README-CN.md) / English

# Introduce  
Here we will intro the functions of Flashloan contract, and how to use this to loan on AAVE

## explanatory of logical of flash loan smart contract  
### Flashloan illustrate  
let's get into `contracts/Flashloan.sol`  
```solidity

import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/FlashLoanReceiverBase.sol";
import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/ILendingPoolAddressesProvider.sol";
import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/ILendingPool.sol";

contract Flashloan is FlashLoanReceiverBase {
    constructor(address _addressProvider) FlashLoanReceiverBase(_addressProvider) public {}
}
```  

We import the required dependence in abouve codes, the contract `Flashloan` is inherit from `FlashLoanReceiverBase` which is an abostract contract, supply several convinience functions, such as the way to repay the flash loan. The constraction function (constructor) of Flashloan.sol accept a loan pool supplier address on Aave. We will explain this later.

### The flashloan function  
Well, let's take a look of flashloan function

```solidity
function flashloan(address _asset) public { // 去掉 onlyOwner，任何人都可调用 flashloan
    bytes memory data = "";
    uint amount = 1 ether;

    ILendingPool lendingPool = ILendingPool(addressesProvider.getLendingPool());
    lendingPool.flashLoan(address(this), _asset, amount, data);
}
```

The paramater `_asset` of flashLoan is the address of where will we use flashloan to loan, like ETH or DAI.

`uint amount = 1 ether;`
In here, we define the loan count unit as `ether`, if we pass the ETH address in, we will take loan 1 ETH , thus 10^18 wei. And if we send DAI address to `_asset`, we will get loan 1 DAI! 

For now, we can call the function `flashLoan` by using `ILendingPool` interfase which from Aave, it contains all paramaters we need, such as assets of we want loan, the count of it and a extra `data` param.

Next, we focus on `executeOperation`  

### The executeOperation function
The `executeOperation` function will be called after contract `LendingPool` get valid assets in flashloan.

```solidity
    function executeOperation(
        address _reserve, uint256 _amount,
        uint256 _fee, bytes calldata _params
    )
        external override
    {
        require(_amount <= getBalanceInternal(address(this), _reserve), "Invalid balance, was the flashLoan successful?");

        //
        // Your logic goes here.
        // !! Ensure that *this contract* has enough of `_reserve` funds to payback the `_fee` !!
        //

        uint totalDebt = _amount.add(_fee);
        transferFundsBackToPoolInternal(_reserve, totalDebt);
    }
```

When we triggered valid flashloan with `flashLoan` function, the all paramaters in `executeOperation` will be passed automatically, and we use `require` to make sure whether we had get the right amount of assets from flashloan.

Then, we can insert any logical we want to excute. In this step, we had have all usable fund from flashloan, and we can use it to have an arbitrage.

After we used flashloan, it's repay time.

`uint totalDebt = _amount.add(_fee);`

In here, we need caculate how much we need repay, which is **loan amount + 0.09% of loan amount (Borrowing charge of Aave flashloan)**.

The final step is calling `transferFundsBackToPoolInternal` to repay the flashloan.

## Steps
- Install dependencies
```shell
yarn
```

- Config the params of envrioument  
```shell
cp .env.example .env
# set INFURA_ID , PRIVATE_KEY in .env
```

- Deploy the contract 
```shell
# we use test net kovan to have test
npx hardhat run scripts/deploy_aave_flashloan.js --network kovan
```

- Start flashloan
```shell
npx hardhat test --network kovan
# After transaction finished, we can check transaction details by returned tx hash
```

## Reference link

- AAVE flashLoan intro: https://finematics.com/how-to-code-a-flash-loan-with-aave/  
