# DyDx 闪电贷

**DyDx 本身并不具备闪电贷功能**，但是，你可以通过对 `SoloMargin` 合约执行一系列操作来实现类似的行为，这是一个隐藏功能。为了在 DyDx 上进行闪电贷，我们需要：

- 借入一定数量的 token
- 使用借入的资金进行套利等一些操作
- 退回借入的 token，在原来借款的数量上 `+2 wei`即可。这 `2 wei` 就是手续费。

所有这些都在一个交易中完成。DyDx 用所谓的元交易来解决这个问题。它允许你执行一系列的操作，直到最后一步才检查状态是否有效。也就是说，只要你在同一笔交易中把资金存回去（并且账户里有大约 2wei 的资产），你就可以随意提取资金，做任何事情。使用元交易，你就可以在一个交易中执行多个交易了。

DyDx 仅支持以下这几种资产，并不支持 eth：

```
WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F
SAI = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359
```

## 初始化闪电贷

想要 DyDx 实现闪电贷功能，合约需要继承 `DydxFlashloanBase`，并实现两个功能：

1. 一个入口函数，你可以调用该函数来初始化闪电贷，我们起名为 `initiateFlashLoan`。

2. 一个叫`callFunction`的回调函数，这是在借贷时要执行的操作， 套利逻辑就在写在这个位置。

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

`initiateFlashLoan` 需要传入 3 个参数， `_solo` 是 ISoloMargin 的地址，`_token` 是需要借入的 token， `_amount` 是需要借入的数量。

1. 是通过 `_solo` 与 `_token` ，得到 `marketId`

2. 是实例化 Actions，数组长度是 3，也就是执行 3 个操作，按照数组顺序依次执行

3. 执行借贷操作

4. 执行套利逻辑，这就是之后要介绍的 `callFunction`

5. 执行还款操作 `initiateFlashLoan` 的代码基本固定不变。

## 套利逻辑

```js
function callFunction(
    address sender,
    Account.Info memory account,
    bytes memory data
) public {
    MyCustomData memory mcd = abi.decode(data, (MyCustomData));
    uint256 balOfLoanedToken = IERC20(mcd.token).balanceOf(address(this)); // (1)
      // 套利逻辑
     // 套利逻辑
    // 套利逻辑
    WETH9(kovanWETHAddr).deposit{value: balOfLoanedToken.add(2)}; // (2)

    uint256 newBal = IERC20(mcd.token).balanceOf(address(this)); // (3)

    require( // (4)
        newBal >= mcd.repayAmount,
        "Not enough funds to repay dydx loan!"
    );

}
```

我们在 `initiateFlashLoan` 定义了 3 个动作，第 2 个动作的实现就是 `callFunction`。假设我们借入 WETH 并返还 WETH。

(1) 获得借入的 token 的余额
(2) 在返还的时候，要比借入的余额多返还 2wei（至少是 2wei），WETH9(kovanWETHAddr).deposit 是充值 weth， 把普通 eth 转化为 weth，使用 deposit 就好。
(3)～(4) 获取新的余额，并判断是不是大于借入的余额，这样才能执行成功。

为此，我们还要引入 WETH 的接口。

```js
interface WETH9 {
    function deposit() external payable;
    function withdraw(uint wad) external;
}
```

`DydxFlashloanBase.sol` 的源码来自 https://github.com/studydefi/money-legos/tree/master/src/dydx 。

## 注意

在部署好合约后，需要往合约地址充入一定的 WETH，闪电贷才能成功，至于 eth 跟 weth 如何互相转化，查看下 https://kovan.etherscan.io/address/0xd0A1E359811322d97991E03f863a0C30C2cF029C#writeContract 就懂了。

DyDx 的闪电贷操作确实比起 Aave 闪电贷要复杂不少，但手续费只需要 `2 wei`，这非常吸引人。

## 案例

合约地址：
https://kovan.etherscan.io/address/0x3cc064c6a0b8629a05f38bc57b6a290ac9489e38#code

---

参考：

https://help.dydx.exchange/en/articles/3724602-flash-loans

https://money-legos.studydefi.com/#/dydx

https://www.youtube.com/watch?v=HKx89FhZNls

https://legacy-docs.dydx.exchange/#solo-protocol
