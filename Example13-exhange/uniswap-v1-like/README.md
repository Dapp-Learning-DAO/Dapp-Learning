# uniswap-v1-like

仿 uniswap-v1 项目(合约部分)，原教程链接见最下方，强烈建议跟着原教程的步骤撸一遍，风味最佳。

截至 2021 年 6 月，Uniswap 已推出三个版本（`V1`, `V2`, `V3`）。

`V1` 只允许在以太币和代币之间进行交换。如果需要进行非 eth 之间的交换，则需要通过 eth 中转。
我们将尝试了解 `V1` 的经济机制，找出、分解、学习和构建它们的核心机制。

## 经济模型

### Market makers (做市商)

做市商是向市场提供流动性（交易资产）的实体。流动性使交易成为可能：如果您想出售某物但没有人购买，则不会进行交易。一些交易对具有高流动性（例如 BTC-USDT），但有些交易对的流动性很低或根本没有（例如一些骗局或山寨币）。

DEX(去中心化交易所)必须有足够（或大量）流动性才能运作并替代中心化交易所。通常需要 DEX 团队投入大量资金来提供足够的流动性(考虑到众多的代币种类，这是一笔庞大的投入)，并且这样会使得 DEX 团队成为唯一的做市商，拥有巨大的权力，有违 DEX 去中心化的初衷。

更好的解决方案是允许任何人成为做市商

### Automated market maker (AMM 自动做市商)

AMM(自动化做市商)是一个通用术语，包含不同的去中心化做市商算法，Uniswap 是其中最受欢迎的算法之一。

### Constant product market maker (恒定的产品做市商)

```math
x∗y=k
```

这是 UniswapV1 的核心公式，`x` 和 `y` 分别代表两个 token(在 V1 中其中一个必定是 eth)的储备量，两者的乘积需要保持一个恒定的值，即 `k`。当您用以太币交易代币时，您将以太币存入合约并获得一定数量的代币作为回报。Uniswap 确保在每次交易后至至 保持不变（然而并非完全不变，会存在无常损失）。

### 如何定价

#### 简单的设想，利用汇率构建价格

```math
Px = y / x,
Py = x / y
```

`x` 和 `y` 代表两个代币的储备量，`Px` 和 `Py` 代表价格。
这是一个简单且符合直觉的设想，然而存在很大的问题。

假设我们用 2000 个 token 和 1000 个 eth 创建了一个流动性池，此时 1 个 token 等于 0.5 个 eth，1 个 eth 等于 2 个 token。

```math
Ptoken = 1000 / 2000 = 0.5 \\
Peth = 2000 / 1000 = 2
```

一切看起来是正确的，但是如果我们利用该池子做交易，将 2000 个 token 交换成 eth 会发生什么？
我们将获得 1000 个 eth，这可是池子里所有的 eth 储备量！**池子被抽干了！**

我们再来看看定价公式，上述定价公式实际上组成了一个和为恒定值的函数。

```math
Msum  = Mx + My = Px * x + Py * y
```

`Msum` 代表两个代币的市值总和，`Mx` 和 `My` 代表两个代币的市值，市值等于 `价格 * 储备量`。

```math
Msum  = (y / x) * x + (x / y) * y = y + x = x + y
```

我们把之前的价格公式带入其中，就会发现总市值实际上就是两者的储备量之和 `x + y`。
即 `x + y = k`, `k` 为常数，其函数图形如下：

![x + y = k](./images/uniswap-v1-like-01.png)

x 轴和 y 轴分别代表了两个代币的储备量，函数穿过 x 轴和 y 轴，根据图形可以很直观的看出这个公式允许`x`和`y`其中一个为 0！
这也就解释了为何我们用 2000 个 token 交换成 eth，流动性会枯竭的原因。

#### 正确的定价公式

```math
x∗y=k
```

每一笔交易都会概变两个代币的储备量，该公式指出无论储备量如何变化， `k` 都应该保持不变。

$$(x + \Delta x)(y - \Delta y) = xy$$

这里的意思是用 $\Delta x$ 数量的`token x` 交换出 $\Delta y$ 数量的 `token y`。所以计算 $\Delta y$ 的公式为：

$$\Delta y = \frac{y \Delta x} {x + \Delta x} $$

请注意，我们现在得到的 $\Delta y$ 是数量而不是价格。计算数量的方法对应 `Exchange.getAmount()`。

![x * y = k](./images/uniswap-v1-like-02.png)

由上图看出来，乘积恒定的函数是一个双曲线，不会与 x 轴或 y 轴相交，这使得储备量近乎无限。

还有一个有趣的特征，双曲线价格函数会导致价格滑点。**购买量越大，价格滑点越高，得到的越少。**
在测试文件 `./test/Exchange.test.js` 中可以看到滑点的变化：

```js
// getTokenAmount
await exchange.getTokenAmount(toWei(1)); // 1.998001998001998001
await exchange.getTokenAmount(toWei(100)); // 181.818181818181818181
await exchange.getTokenAmount(toWei(1000)); // 1000.0

// getEthAmount
await exchange.getEthAmount(toWei(2)); // 0.999000999000999
await exchange.getEthAmount(toWei(100)); // 47.619047619047619047
await exchange.getEthAmount(toWei(2000)); // 500
```

如上所示，当我们试图掏空池子的时候，我们只得到预期的一般。

这里要注意的最后一件事：我们最初的、基于汇率的定价函数没有错。事实上，当我们交易的代币数量与储备相比非常小时，这是正确的。但是要制作 AMM，我们需要更复杂的东西。

## `Exchange.sol` 合约实现

### 定价功能

虽然是定价功能，但实际上我们得出的是能够换取的数量。

```solidity
// This is a low-level function, so let it be private.
function getAmount(
    uint256 inputAmount,
    uint256 inputReserve,
    uint256 outputReserve
) private pure returns (uint256) {
    require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

    return (inputAmount * outputReserve) / (inputReserve + inputAmount);
}

// 传入token数量得到能够换取的eth数量
function getTokenAmount(uint256 _ethSold) public view returns (uint256)

// 传入eth数量得到能够换取的token数量
function getEthAmount(uint256 _tokenSold) public view returns (uint256)
```

### 交易功能(swap)

现在，我们已准备好实现交易功能

```solidity
// 使用eth购买token
function ethToTokenSwap(uint256 _minTokens) public payable {
    uint256 tokenReserve = getReserve();
    uint256 tokensBought = getAmount(
        msg.value,
        address(this).balance - msg.value,
        tokenReserve
    );

    require(tokensBought >= _minTokens, "insufficient output amount");

    IERC20(tokenAddress).transfer(msg.value, tokensBought);
}
```

将以太币换成代币意味着将一定数量的以太币（存储在 `msg.value` 变量中）发送到可支付的合约函数并获得代币作为回报。请注意，我们需要 `msg.value` 从合约的余额中减去，因为在调用该函数时，发送的以太币已经添加到其余额中。

这里的另一个重要变量是 `__minTokens` ——这是用户想要用以太币换取的最小数量的代币。此金额在 UI 中计算，并且始终包括滑点容差；用户同意至少获得那么多但不少于。这是一个非常重要的机制，可以保护用户免受前端机器人的攻击，这些机器人试图拦截他们的交易并修改池余额以获取利润。

```solidity
// 使用token购买eth
function tokenToEthSwap(uint256 _tokensSold, uint256 _minEth) public {
    uint256 tokenReserve = getReserve();
    uint256 ethBought = getAmount(
        _tokensSold,
        tokenReserve,
        address(this).balance
    );

    require(ethBought >= _minEth, "insufficient output amount");

    IERC20(tokenAddress).transferFrom(msg.sender, address(this), _tokensSold);
    payable(msg.sender).transfer(ethBought);
}
```

`_tokensSold`从用户的余额中转移代币，并发送以太币 `ethBought` 作为交换。

## 参考链接

原教程：https://jeiwan.net/posts/programming-defi-uniswap-1/
源代码仓库：https://github.com/Jeiwan/zuniswap/tree/part_1/
Uniswap V1 文档: https://uniswap.org/docs/v1/
Uniswap V1 white paper: https://hackmd.io/@HaydenAdams/HJ9jLsfTz
