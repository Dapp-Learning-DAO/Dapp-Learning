# 简介  
下面将介绍  Flashloan 合约的功能，以及如何使用 Flashloan 合约在 AAVE 上进行借贷

## 闪电贷智能合约逻辑说明
### Flashloan 说明   
来看下 `contracts/Flashloan.sol`  
```solidity

import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/FlashLoanReceiverBase.sol";
import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/ILendingPoolAddressesProvider.sol";
import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/ILendingPool.sol";

contract Flashloan is FlashLoanReceiverBase {
    constructor(address _addressProvider) FlashLoanReceiverBase(_addressProvider) public {}
}
```  

这是导入所必要的依赖项，Flashloan 合约继承自`FlashLoanReceiverBase`，它是一个抽象合约，提供了一些有用的方法，比如如偿还闪电贷的方式。 Flashloan.sol 构造函数接受 Aave 的一个贷款池提供者的地址。我们会稍后将介绍。   

### flashloan 方法   
我们先来看 flashLoan 函数。

```solidity
function flashloan(address _asset) public { // 去掉 onlyOwner，任何人都可调用 flashloan
    bytes memory data = "";
    uint amount = 1 ether;

    ILendingPool lendingPool = ILendingPool(addressesProvider.getLendingPool());
    lendingPool.flashLoan(address(this), _asset, amount, data);
}
```

flashLoan 的参数`_asset`是我们要用闪电贷借款的资产地址，比如 ETH 或 DAI。

`uint amount = 1 ether;`
在这里，我们定义的借款金额的单位是`ether`，如果把 ETH 地址传过去，我们就会借到 1 个 ETH，即 10^18 wei。如果把 DAI 地址传给 `_asset`，我们就会借到 1 个 DAI。  

现在，我们可以使用 Aave 提供的 `ILendingPool`接口，调用`flashLoan`函数，其中包含所有需要的参数，如我们想要借入的资产、该资产的金额和一个额外的`data`参数。  

我们还要关注 `executeOperation`   

### executeOperation 方法

`executeOperation` 函数将被 `LendingPool` 合约在闪电贷中请求有效的资产后被调用。

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

在使用 `flashLoan` 函数触发有效的闪电贷后，`executeOperation` 函数的所有参数都将被自动传递，`require` 用来确保收到的闪电贷金额是否正确。

接下来，我们可以插入任何想要执行的逻辑。在这个步骤中，我们拥有了来自闪电贷的所有可用资金，因此，我们可以尝试套利机会。

我们在用完闪电贷后，就需要偿还资金了。

`uint totalDebt = _amount.add(_fee);`

在这里，我们要计算还多少钱，也就是 **借款金额 + 借款金额的 0.09%**。**Aave 的闪电贷需要手续费**。

最后一步就是调用 `transferFundsBackToPoolInternal` 来偿还闪电贷。

## 操作步骤
- 安装依赖  
```shell
yarn
```

- 配置环境变量  
```shell
cp .env.example .env
# 在 .env 中配置  INFURA_ID , PRIVATE_KEY
```

- 部署合约  
```shell
# 这里使用 kovan 测试网进行测试
npx hardhat run scripts/deploy_aave_flashloan.js --network kovan
```

- 发起闪电贷
```shell
npx hardhat test --network kovan
# 交易完成后，根据答应的 tx hash 检查交易细节
```

## 参考

- AAVE flashLoan 介绍： https://finematics.com/how-to-code-a-flash-loan-with-aave/  
