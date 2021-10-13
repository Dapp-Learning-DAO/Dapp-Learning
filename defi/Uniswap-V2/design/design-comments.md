## 参考

最近在学习 [Uniswap V2](https://app.uniswap.org/#/)

关于整体框架的文章早有珠玉在前，如

- [当面试官问你Uniswap的时候，你应该想到什么？](https://learnblockchain.cn/article/2753)
- [精通Uniswap](https://learnblockchain.cn/article/1448)

这里记录一下边角

参考

- [Uniswap Docs V1](https://docs.uniswap.org/protocol/V1/introduction)
- [Formal Specification of Constant Product (x × y = k) Market Maker Model and Implementation](https://github.com/runtimeverification/verified-smart-contracts/blob/master/uniswap/x-y-k.pdf)
- [Uniswap Docs V2: Advanced Topics](https://uniswap.org/docs/v2/advanced-topics/)
- [Uniswap V2 Audit Report](https://uniswap.org/audit.html)

## 首次铸币的漏洞

如果在首次注入流动性时，直接使用 `Math.sqrt(amount0.mul(amount1))` 为总流动性，会导致一个漏洞：为了垄断交易对，早期的流动性参与者可以刻意抬高流动性单价，使得散户无力参与，即无法提供流动性

攻击流程为:

首先，发送小额 token (比如 1 wei) 到交易对并且 `mint()`，得到 1 wei `LP Tokens`，此时池子中 `totalSuppy` 为 1 wei，`reserve0` 和 `reserve1` 也为 1 wei

然后，发送大额 token (比如 2000 ether) 到交易对，但不调用 `mint()`，而是直接调用 `sync()`，此时池子中 `totalSuppy` 为 1 wei，`reserve0` 和 `reserve1` 分别为 1 wei + 2000 ether

攻击结束，此时流动性单价为 <img src="https://render.githubusercontent.com/render/math?math=\frac{(1%20%2B%202000%20\times%2010^{18})}{1}%20\approx%202000%20\times%2010^{18}" /> ，即约为 `2000 ether`

换句话说，散户即使只想提供最小单位的 1 wei 流动性，也要付出 2000 ether 的 token，只能望洋兴叹了..

根据白皮书公式 (7)

<img src="https://render.githubusercontent.com/render/math?math=s_{m}%20=%20\frac{\sqrt{k_{2}}%20-%20\sqrt{k_{1}}}{5%20\cdot%20\sqrt{k_{2}}%20%2B%20\sqrt{k_{1}}}%20\cdot%20s_{1}" />

又有 <img src="https://render.githubusercontent.com/render/math?math=\sqrt{k_{2}}%20\ggg%20\sqrt{k_{1}}" />，且 <img src="https://render.githubusercontent.com/render/math?math=s_{1}" /> 为 1，且计算时整数相除

所以

<img src="https://render.githubusercontent.com/render/math?math=s_{m}%20\approx%20\left\lfloor%20\frac{\sqrt{k_{2}}}{5%20\cdot%20\sqrt{k_{2}}}%20\cdot%20s_{1}%20\right\rfloor%20=%20\left\lfloor%20\frac{1}{5}%20\cdot%201%20\right\rfloor%20=%200" />

好家伙，手续费的平台部分 (<img src="https://render.githubusercontent.com/render/math?math=\frac{1}{6}" />) 为 0，羊毛都被薅秃了...

为了解决这个问题，必须降低参与门槛，即降低流动性单价；换句话说，必须限制总流动性的下限

首次注入流动性的源码如下

``` js
contract UniswapV2Pair is IUniswapV2Pair, UniswapV2ERC20 {
    using SafeMath  for uint;
    uint public constant MINIMUM_LIQUIDITY = 10**3;

    function mint(address to) external lock returns (uint liquidity) {
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        }
    }
    require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
}
```

这里 `uint` 使用 `SafeMath`，所以 `sub()` 操作会有溢出检查，也就是说首次铸币时总流动性大于 `MINIMUM_LIQUIDITY` (1000)，否则会 REVERT

为了避免攻击者通过 `burn()` 将流动性销毁，导致总流动性不低于 1000 的限制被绕过，代码还会从首次铸币者本应获得的流动性中扣除 1000 ，将其发往 `address(0)` 锁住，以此达成限制

在这种限制下，如果重新执行攻击流程，流动性单价最大值为 <img src="https://render.githubusercontent.com/render/math?math=\frac{(1001%20%2B%202000%20\times%2010^{18})}{1001}%20\approx%202%20\times%2010^{18}" /> ，即约为 `2 ether`

对散户而言，比起 `2000 ethen` 的单价，友好很多，终于可以参与了

// 如果还是觉得门槛很高，记住：穷是我等散户的问题

更重要的是，平台也能收到手续费了..

站在散户和平台的角度来看，这是双赢..

至于首次铸币者的损失么，好像没什么人会关心..

不过即使交易对的 token 都非常非常值钱，比如说 1 个 token 值 <img src="https://render.githubusercontent.com/render/math?math={10}^{18}" /> 美元，首次铸币者也就损失 2000 美元而已..

换句话说，平台从被薅，摇身一变，薅起了大户的九羊一毛

双赢就是平台赢了两次

## 谁的利益

如上所述，首次铸币时，为了解决攻击漏洞，牺牲了首次铸币者的利益

实际上，Uniswap 中存在很多除法，在无法整除的情况下，不同的 round 方式，偏向的利益方也各不不同

对比明显的两个函数如下

``` js
// given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
    require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    uint amountInWithFee = amountIn.mul(997);
    uint numerator = amountInWithFee.mul(reserveOut);
    uint denominator = reserveIn.mul(1000).add(amountInWithFee);
    amountOut = numerator / denominator;
}

// given an output amount of an asset and pair reserves, returns a required input amount of the other asset
function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
    require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    uint numerator = reserveIn.mul(amountOut).mul(1000);
    uint denominator = reserveOut.sub(amountOut).mul(997);
    amountIn = (numerator / denominator).add(1);
}
```

两个函数都必须偏向流动性提供者，因此它们的最后一行分别不加 1 和加 1，即 `AmountOut` 向下取整数，`amountIn` 向上取整

另外，

`_update()`，误差会累加，无所谓偏向谁的利益，只是提供一个机制，预言机自行决定实现；如果交易对精度很高 (`decimals` 很小)，误差会很大

`mint()` 注入流动性时，偏向已有的流动性提供者

`burn()` 销毁流动性时，偏向仍旧留下的流动性提供

`_mintFee()` 平台收取手续费时，偏向平台

## 矿工的攻击

### 两种攻击收益

1. 滑点收益

在用户交易前后夹上自己的两个 `swap()` 交易，分别为换入和换回，以此赚得滑点收益，薅的是用户的羊毛

Uniswap 部分了解决这个问题：periphery 允许用户在交易时设置最小输出参数 `amountOutMin`，

2. 手续收益

在用户交易前后夹上自己的 `mint()` 交易 和 `burn()` 交易，提供临时的海量流动性，以此赚得手续收益，薅的是流动性提供者的羊毛

Uniswap V2 未解决这个问题

### 两个攻击例子

#### 例子1

参考：[Ethereum is a Dark Forest](https://www.paradigm.xyz/2020/08/ethereum-is-a-dark-forest/)：

有位 Uniswap 用户错误地将代币直接转给了交易对 (正确的方式是：而非 `approve()` 后调用 `mint()`），在社群上求助，希望可以取回代币

首次铸币漏洞的发现者 Dan Robinson，马上检查了交易对，发现交易对中差额 (`balance` > `reserve`) 还存在

此时，只要发起交易，直接调用 `skim()` (或者像文章一样调用 `burn()`)，即可取回差额

悲剧的是，交易被抢跑了... [抢跑交易在这](https://etherscan.io/tx/0xcc7f752e990b32befa1e0c82b036b3753ec3d876b336007cd568983dca0af497)

#### 例子2

今年 3 月份 DODO 交易所资金池被黑客攻击，转走近 200 万美元的资产

// 受害人声泪俱下，[围观地址](https://learnblockchain.cn/video/play/273) (空降指挥部 30:15)

喜剧的是，黑客在试图转移资产时，交易被白帽抢跑了..

samczsun 大佬协助联系白帽，取回了部分资产，参考：

[关于DODO黑客事件的最新进展](https://community.dodoex.co/t/topic/925)
[DODO 攻击事件总结：已追回310万美金，一周内恢复众筹建池](https://community.dodoex.co/t/topic/943)

### 解决?

抢跑和重排，是个结构性问题；虽然以太坊目前无法在机制上解决，但也有非常之策，比如 samczsun 大佬，跑得比抢跑者还快 [Escaping the Dark Forest](https://samczsun.com/escaping-the-dark-forest/)

为了对抗抢跑交易，另一类人开发了 [Flash Bots](https://docs.flashbots.net/) 客户端，原理是将交易以私密形式发给 Flashbots 节点，只有成功出块时才做广播

Flashbots 似乎很常见了，比如我最近的两笔 SushiSwap 交易，都由 Flashbots 节点挖出：

[Swap 交易](https://etherscan.io/tx/0x38ec4d360c3198c997b66970370a6b764f5e56f58352d2625a71b2afdda4b901)，[所在区块](https://etherscan.io/block/13205280)

[Swap 交易](https://etherscan.io/tx/0xcdcd1c4df27bcaa3b81f3db357f6c8f91606d513ee1f44317789cdf2a4a6eefb)，[所在区块](https://etherscan.io/block/13205340)

### 反思

Flash Boys 并非万无一失，也承担着风险：如果它挖出抢炮区块时正好发生分叉，所挖区块被大多数节点当成叔块..

因为叔块包含了 Flash Boys 签名的抢跑交易，所以又有攻击者可以将抢跑交易在新区块中重放，抢跑其抢跑交易

## 非标准的 ERC-20

ERC-20 定义的 `transferFrom` 接口如下

``` js
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}
```

然而，某些 token 在实现时，会在判断余额满足 `amount` 后，扣除部分手续费，再转给 `recipient`

即 `recipient` 实际收到的数额，会比 `amount` 小，因此我们不能简单以其返回值 `true` 作为判断依据

前两天刚刚有个闪电贷攻击事件，黑客就是利用了这种非标 token 的问题，薅了百余个 ETH

参考 [Avalanche 链上闪电贷攻击事件 —— Zabu Finance 被黑分析](https://mp.weixin.qq.com/s/fR5dVzpaoggwgGMyUih-ug)

出于安全考虑，Uniswap 处理时以交易对自身 `balance` 为准

出于方便用户的考虑，Uniswap 提供如下接口：

``` js
interface IUniswapV2Router02 is IUniswapV2Router01 {
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}
```

## 预言机

Uniswap V2 使用基于时间权重的算数平均数，所以无法像 V1 一样，根据一个代币的 spot price，求其倒数作为另一个代币的价格

即两个算数平均数之间无直接关系，因此两个价格必须都存下来

![Storing Cumulative Price Data On-Chain](https://docs.uniswap.org/assets/images/v2_onchain_price_data-c051ebca6a5882e3f2ad758fa46cbf5e.png)

实际上，算数平均数是调和平均数的倒数，比如以上 [官方文档](https://docs.uniswap.org/protocol/V2/concepts/core-concepts/oracles) 中的例子，简单计算如下：

priceA 算数平均数

<img src="https://render.githubusercontent.com/render/math?math=\begin{aligned}%20\small\text{WAM}_{priceA}%20=%20\frac{10200}{1000}%20\times%20\frac{7}{20}%20%2B%20\frac{10300}{1000}%20\times%20\frac{8}{20}%20%2B%20\frac{10500}{1000}%20\times%20\frac{5}{20}%20\\%20=%20\frac{10200%20\times%207%20%2B%2010300%20\times%208%20%2B%2010500%20\times%205}{1000%20*%2020}%20\end{aligned}" />

PriceB 调和平均数

<img src="https://render.githubusercontent.com/render/math?math=\begin{aligned}%20\small\text{WHM}_{PriceB}%20=%20\frac{1}{\frac{\frac{7}{20}}{\frac{1000}{10200}}%20%2B%20\frac{\frac{8}{20}}{\frac{1000}{10300}}%20%2B%20\frac{\frac{5}{20}}{\frac{1000}{10500}}}%20=%20\frac{20}{\frac{7}{\frac{1000}{10200}}%20%2B%20\frac{8}{\frac{1000}{10300}}%20%2B%20\frac{5}{\frac{1000}{10500}}}%20\\%20=%20\frac{1000%20*%2020}{10200%20\times%207%20%2B%2010300%20\times%208%20%2B%2010500%20\times%205}%20\end{aligned}" />


可见二者互为倒数

<img src="https://render.githubusercontent.com/render/math?math=\small\text{WAM}_{priceA}%20=%20\frac{1}{\small\text{WHM}_{priceB}}" />

反之，priceA 调和平均数 与 priceB 算数平均数 也互为倒数

当然，假设使用几何平均数，那么存储一个价格足以，例如

<img src="https://render.githubusercontent.com/render/math?math=\small\text{WGM}_{priceA}%20=%20\sqrt[7%2B8%2B5]{{\frac{10200}{1000}}^7%20\times%20{\frac{10300}{1000}}^8%20\times%20{\frac{10500}{1000}}^5}" />

<img src="https://render.githubusercontent.com/render/math?math=\small\text{WGM}_{priceB}%20=%20\sqrt[7%2B8%2B5]{{\frac{1000}{10200}}^7%20\times%20{\frac{1000}{10300}}^8%20\times%20{\frac{1000}{10500}}^5}" />

可见

<img src="https://render.githubusercontent.com/render/math?math=\small\text{WGM}_{priceA}%20=%20\frac{1}{\small\text{WGM}_{priceB}}" />

只是在这里，前后区块的价格无复合关系，几何平均数并不适用

另外，在 EVM 中计算几何平均数也比较麻烦
