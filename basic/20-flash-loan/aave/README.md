 
## 安装和设置

我们需要全局安装 truffle，了解 node 的人不会陌生

`npm install -g truffle@latest`

安装完之后，开始第 2 步

## 安装 aave flashloan-box

`truffle unbox aave/flashloan-box`

这个过程中需要特殊的上网技巧，下载完 flashloan-box， 我们会得到 1 个完整的基于 Truffle 框架的合约代码。

```
├── README.md
├── contracts (1)
├── env (2)
├── migrations
├── node_modules
├── package.json
└── truffle-config.js (3)
```

(1) 是合约文件

(2) 环境变量，保存 INFURA_API_KEY、DEPLOYMENT_ACCOUNT_KEY 这些变量

(3) 是 truffle 的配置文件

## 闪电贷智能合约

来看下 `contracts/Flashloan.sol`

```js

import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/FlashLoanReceiverBase.sol";
import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/ILendingPoolAddressesProvider.sol";
import "https://github.com/aave/flashloan-box/blob/Remix/contracts/aave/ILendingPool.sol";

contract Flashloan is FlashLoanReceiverBase {
    constructor(address _addressProvider) FlashLoanReceiverBase(_addressProvider) public {}
}
```

这是导入所必要的依赖项，Flashloan 合约继承自`FlashLoanReceiverBase`，它是一个抽象合约，提供了一些有用的方法，比如如偿还闪电贷的方式。 Flashloan.sol 构造函数接受 Aave 的一个贷款池提供者的地址。我们会稍后将介绍。

## flashloan 方法

我们先来看 flashLoan 函数。

```
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

## executeOperation 方法

`executeOperation` 函数将被 `LendingPool` 合约在闪电贷中请求有效的资产后被调用。

```js
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

## Kovan 测试网

分析完闪电贷合约，已经可以部署了，假设我们要借出 Dai，但还要准备 2 个必要的东西：

- `LendingPoolAddressesProvider` —— 为了部署合约，我们需要找到 Aave 在 Kovan 测试网上的借贷合约的地址。它地址是`0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5`。你可以在[Aave 文档](https://docs.aave.com/developers/deployed-contracts) 找到所有的地址。

- DAI 地址，我们需要 DAI（或你想借用的任何其他资产）在 Kovan 测试网的合约地址。它的地址是`0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD`。

## 编译合约

运行 `truffle compile`，将编译合约，我们把 Solidity 的版本设定为`0.6.12`，成功后的提示是：

```
> Compiled successfully using:
   - solc: 0.6.12+commit.27d51765.Emscripten.clang
```

## 获取测试币

给[0x505A51009FdA1A20131C87c34Cfad6FDe6B82A36](https://kovan.etherscan.io/address/0x505a51009fda1a20131c87c34cfad6fde6b82a36) 发一些测试币。

我们还需要一些 DAI。要获得 DAI，访问 `https://staging.aave.com/#/faucet` 并点击 DAI，然后点击 “提交” 按钮，我们将会收到 10,000 个 Dai。

## 部署合约

我们在 `env` 文件中配置好 infura 的 api key 以及 0x505A51009FdA1A20131C87c34Cfad6FDe6B82A36 对应的私钥

```js
INFURA_API_KEY = "API_KEY"
DEPLOYMENT_ACCOUNT_KEY = "地址私钥"
```

运行 `truffle migrate --network kovan --reset --skip-dry-run`，给 Flashloan 合约的构造函数传递的 lendingPoolProvider 是`0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5`。

```js
// migrations/2_deploy_contracts.js

let lendingPoolProviderAddr;

switch (network) {
  case "mainnet":
    lendingPoolProviderAddr = "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8";
    break
  case "kovan":
    lendingPoolProviderAddr = "0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5";
    break
  default:
    throw Error(``)
}

await deployer.deploy(Flashloan, lendingPoolProviderAddr)
```

部署好后，合约地址是 [0x3cC064c6A0b8629A05f38Bc57b6A290AC9489E38](https://kovan.etherscan.io/address/0x3cC064c6A0b8629A05f38Bc57b6A290AC9489E38#code)。

## 发起闪电贷

我们先给合约地址充值 100 Dai，然后在 [合约页面](https://kovan.etherscan.io/address/0x3cC064c6A0b8629A05f38Bc57b6A290AC9489E38#writeContract)调用`flashLoan`函数并通过 Metamask 接受 Ethereum 交易后，你应该会看到一个[交易](https://kovan.etherscan.io/tx/0x17aa0c8d6c36211976ca35cdc5a6f2597aaf64a63d87d46bafffa9ffb6c1716f)。

恭喜你，你刚完成了一笔闪电贷交易!

---

## 参考

- https://finematics.com/how-to-code-a-flash-loan-with-aave/
