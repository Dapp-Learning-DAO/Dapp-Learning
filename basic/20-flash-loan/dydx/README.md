[中文](./README-CN.md) / English

# DyDx flash loan  
## introduce    
**DyDx doesn't supply the flash loan function itself**, but you can implement a similar function by executing a series of operations to `SoloMargin` contract, it's a hidden function. To we can use the flash loan in DyDx, we need: 

- borrow a number of tokens
- use these funds to do some operations such as interest arbitrage
- return borrowed tokens, also you need plus `2 wei`, which is the service charge

All of these will be finished in one transaction. DyDx uses so-called meta-transaction to solve this problem. It allowed you can do several operations, till the final step to check whether the state is valid. Which is, as long as you can store back the fund you had loaned(and your account has extra about 2 wei assets), then you can loan assets freely and do anything with them. By using meta-transaction, you can execute a multi transactions in it.

DyDx only supports several assets below, excluding eth: 

```
WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F
SAI = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359
```

## contract functions illustrate  
### initiateFlashLoan interface  
If we want to use the flash loan in DyDx, our contract needs to inherit `DydxFlashloanBase`, and implement two functions: 
1. An entry function, you can call this function to initiate a flash loan, we name it as `initiateFlashLoan`.

2. A callback function `callFunction`, in here we execute operations after we had loaned, like some codes about arbitrage.

```js
function initiateFlashLoan(address _solo, address _token, uint256 _amount) external {
    ISoloMargin solo = ISoloMargin(_solo);

    // Get marketId from token address
    uint256 marketId = _getMarketIdFromTokenAddress(_solo, _token); // (1)

    uint256 repayAmount = _getRepaymentAmountInternal(_amount);
    IERC20(_token).approve(_solo, repayAmount);

    Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3 "] memory operations = new Actions.ActionArgs["); // (2)

    operations[0] = _getWithdrawAction(marketId, _amount); // (3)
    operations[1] = _getCallAction(
        // Encode MyCustomData for callFunction
        abi.encode(MyCustomData({token: _token, repayAmount: repayAmount}))
    ); // (4)
    operations[2] = _getDepositAction(marketId, repayAmount); // (5)

    Account.Info[] memory accountInfos = new Account.Info[](1 "] memory accountInfos = new Account.Info[");
    accountInfos[0] = _getAccountInfo();

    solo.operate(accountInfos, operations);
}
```

The `initiateFlashLoan` needs three parameters, `_solo` is the address of ISoloMargin, `_token` is the token address we want to loan, `_amount` is the number of all we want to loan.

1. get `marketId` by `_solo` and `_token` 

2. initialize Actions, the length of Array is 3, which is execute 3 actions and the order of execution will follow the sequence in Array.

3. execute loan operations

4. execute the logic of arbitrage, which is `callFunction` that we will intro after time

5. execute repay operation, we don't need to change codes in `initiateFlashLoan` a lot.

### callFunction callback api  

```js
function callFunction(
    address sender,
    Account.Info memory account,
    bytes memory data
) public {
    MyCustomData memory mcd = abi.decode(data, (MyCustomData));
    uint256 balOfLoanedToken = IERC20(mcd.token).balanceOf(address(this)); // (1)
      // logic of arbitrage
     // logic of arbitrage
    // logic of arbitrage
    WETH9(kovanWETHAddr).deposit{value: balOfLoanedToken.add(2)}; // (2)

    uint256 newBal = IERC20(mcd.token).balanceOf(address(this)); // (3)

    require( // (4)
        newBal >= mcd.repayAmount,
        "Not enough funds to repay dydx loan!"
    );

}
```

We defined 3 actions in `initiateFlashLoan`, and the implementation of the second one is `callFunction`. If we borrow WETH and return it back.

(1) Get the amount of token we borrowed
(2) When we repay it, the amount needs to be 2 wei more than the number we borrowed before(at least 2 wei), WETH9(kovanWETHAddr).deposit used to charge weth, to translate normal eth to weth, we just use deposit is enough. 
(3)～(4) Get a new balance, and check whether it is greater than the amount we had borrowed, then it can be called success.

Hence, we also need to import the interface of WETH.

```js
interface WETH9 {
    function deposit() external payable;
    function withdraw(uint wad) external;
}
```

## Steps  
- Install dependencies  
```shell
yarn
```

- Config the envrioument  
```shell
cp .env.example .env
# set INFURA_ID , PRIVATE_KEY in .env
```

- Deploy the contract  
```shell
npx hardhat run scripts/deploy.js --network kovan
```

- Start flashloan  
```shell
npx hardhat run scripts/dydxFlashloaner.js --network kovan
```

## Additional Remarks
After we deployed the contract, we also need to transfer an amount of WETH to the contract address, then the flash loan can be executed successfully, as to how to transfer between eth and weth, you will get it by checking https://kovan.etherscan.io/address/0xd0A1E359811322d97991E03f863a0C30C2cF029C#writeContract.  
The flash loan operation in DyDx do more complicated than in Aave, but lower to 2 wei service charge, which is quite attractive.

## Reference link  

- dydx.exchange: https://help.dydx.exchange/en/articles/3724602-flash-loans    

- DyDx Flash Loan： https://www.youtube.com/watch?v=HKx89FhZNls  

- solo-operations： https://legacy-docs.dydx.exchange/#solo-protocol   

- Source codes of DydxFlashloanBase.sol : https://github.com/studydefi/money-legos/tree/master/src/dydx  
- Example: https://kovan.etherscan.io/address/0x3cc064c6a0b8629a05f38bc57b6a290ac9489e38#code   
