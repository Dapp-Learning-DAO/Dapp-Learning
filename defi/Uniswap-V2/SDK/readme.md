### 背景

- 看了下 V2 SDK，核心是为满足部分请求、操作链上数据场景的公共需求而设计，服务于基于 UniSwap 构建应用场景，或者一些快速开发的 Hackthon 场景，因此直接选取官方版本。
- 从 Quick start 开始给大家做介绍。

#### SDK 结构

- 核心是三个部分：pair、route、trade，服务于外部业务的调用，提供 Token 信息、交易对输入输出信息、交易过程数据、最优路径等等方面功能服务。

#### Start

- https://docs.uniswap.org/sdk/2.0.0/guides/quick-start

- yarn add @uniswap/sdk
- 目前两个场景获取链上信息
- 1.获取/操作 Token 相关信息/数据

```
constructor(chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string)
```

- 必填参数 3 个：
  **chainId** &nbsp;&nbsp;&nbsp;&nbsp;-> &nbsp;&nbsp;目标链的 Id
  **address** &nbsp;&nbsp;&nbsp;-> &nbsp;&nbsp;token 的地址
  **decimals** &nbsp;-> &nbsp;&nbsp;token 的精度
- 可选参数：
  **symbol** &nbsp;&nbsp;-> &nbsp;&nbsp;token 的标识 / 符号
  **name** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-> &nbsp;&nbsp;token 的名字

```
import { ChainId, Token } from "@uniswap/sdk";

const chainId = ChainId.MAINNET;
const tokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI,must be checksummed
const decimals = 18; //精度

const DAI = new Token(chainId, tokenAddress, decimals);
// 注： 初始化token的参数是按照严格顺序的，如果你想不设置token的symbol
//     只传入name的话，需要用 undefined 填充 symbol 的位置
// 例： const DAI = new Token(chainId, tokenAddress, decimals, undefined, name);
```

#### 获取数据

1.Token 的数据

- 通过使用构造函数 `new Token` 基于用户提供的数据创建
- 根据 SDK 提供的 [Fetcher](#Fetcher) 的 `fetchTokenData` 方法异步获取

2.获取交易对数据
需要客户提供数据基础上获取，多个场景需要

- 通过使用构造函数 `new Pair` 基于用户提供的数据创建
- 根据 SDK 提供的 [Fetcher](#Fetcher) 的 `fetchPairData` 方法异步获取

#### 价格

价格分为 Mid Price 和 Excution Price。

对于 Mid Price，是反映一个或多个交易对保有率（ratio of reserves）的价格。

以 DAI-WETH 为例：

1. 通过`DAI/WETH`交易对直接获取价格

```
import { ChainId, Token, WETH, Fetcher, Route } from "@uniswap/sdk";

const DAI = new Token(
  ChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18
);

// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

const route = new Route([pair], WETH[DAI.chainId]);

console.log(route.midPrice.toSignificant(6)); // 201.306
console.log(route.midPrice.invert().toSignificant(6)); // 0.00496756
```

2. 间接获取
   当直接对应的`DAI/WETH`交易对不存在时，通过获取与目标`token`直接或者间接有关联的`token`组成的交易对（ 示例中是：`USDC/WETH`，`DAI/USDC` ），根据`Route`构造交易路径来间接获取价格

```
import { ChainId, Token, WETH, Fetcher, Route } from "@uniswap/sdk";

const USDC = new Token(
  ChainId.MAINNET,
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6
);
const DAI = new Token(
  ChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18
);

// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
const USDCWETHPair = await Fetcher.fetchPairData(USDC, WETH[ChainId.MAINNET]);
const DAIUSDCPair = await Fetcher.fetchPairData(DAI, USDC);

const route = new Route([USDCWETHPair, DAIUSDCPair], WETH[ChainId.MAINNET]);

console.log(route.midPrice.toSignificant(6)); // 202.081
console.log(route.midPrice.invert().toSignificant(6)); // 0.00494851
```

对于执行价格（真实价格），即交易的执行价格，我们可以将其看作是一个 sent 比 received 的比率（the ratio of assets sent/received）。

以一个 1 WETH for DAI 的交易为例：

```
import {
  ChainId,
  Token,
  WETH,
  Fetcher,
  Trade,
  Route,
  TokenAmount,
  TradeType,
} from "@uniswap/sdk";

const DAI = new Token(
  ChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18
);

// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

const route = new Route([pair], WETH[DAI.chainId]);

const trade = new Trade(
  route,
  new TokenAmount(WETH[DAI.chainId], "1000000000000000000"),
  TradeType.EXACT_INPUT
);

console.log(trade.executionPrice.toSignificant(6));
console.log(trade.nextMidPrice.toSignificant(6));
```

#### 交易

直接发送交易到 Router：
用`1 WETH` 兑换尽可能多的 `DAI`

```
import {
  ChainId,
  Token,
  WETH,
  Fetcher,
  Trade,
  Route,
  TokenAmount,
  TradeType,
} from "@uniswap/sdk";

const DAI = new Token(
  ChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18
);

// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

const route = new Route([pair], WETH[DAI.chainId]);

const amountIn = "1000000000000000000"; // 1 WETH

const trade = new Trade(
  route,
  new TokenAmount(WETH[DAI.chainId], amountIn),
  TradeType.EXACT_INPUT
);
```

#### 交易对地址

1.直接获取
通过调用工厂合约的 [getPair](https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory#getpair) 方法直接获取

2.create2 获取
使用这个方法有以下几个特点：

- `token0` 的地址必须小于 `token1`
- 可以离线计算
- 需要当前环境可以执行 `keccak256` 方法

```
import { FACTORY_ADDRESS, INIT_CODE_HASH } from "@uniswap/sdk";
import { pack, keccak256 } from "@ethersproject/solidity";
import { getCreate2Address } from "@ethersproject/address";

const token0 = "0xCAFE000000000000000000000000000000000000"; // change me!
const token1 = "0xF00D000000000000000000000000000000000000"; // change me!

const pair = getCreate2Address(
  FACTORY_ADDRESS,
  keccak256(["bytes"], [pack(["address", "address"], [token0, token1])]),
  INIT_CODE_HASH
);
```

### 引用范例

#### 概述

SDK 的依赖是对等依赖（peer dependencies），就是你如果没有单独安装，则需要单独安装，如果整体安装了，也就不需要了。这样做有两点好处：

1. 防止项目安装了用不到的依赖 ( 例如依赖 @ethersproject/providers 和 @ethersproject/contracts，只有当我们要使用 `Fetcher` 时才需要安装 )。

2. 防止我们安装 @ethersproject 时，引入了具有冲突版本的某些依赖。
   简单来看，遇到依赖了 yarn 装下就行，我是这样理解的。

以下是 SDK 的关键实体的使用：

#### Token

Token 的定义

```
constructor(chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string)
```

特定链的特定地址的 Token，ERC20

```
import { ChainId, Token } from "@uniswap/sdk";

const token = new Token(
  ChainId.MAINNET,
  "0xc0FFee0000000000000000000000000000000000",
  18,
  "HOT",
  "Caffeine"
);
```

**核心的属性包括：**

- chainId
- address
- decimals
- symbol
- name

**方法包括**

- equals
  `equals(other: Token): boolean`
  - 检测当前的 token 是否与给定的 token 相同
    ```
    tokenA.equals(tokenB)
    ```
- sortsBefore
  `sortsBefore(other: Token): boolean`
  - 检查当前 token 的地址是否在另一个之前
    ```
    tokenA.sortsBefore(tokenB)
    ```

#### Pair

交易对实体，代表一个 Uniswap 交易对，其中保存了对应的每个 token 的余额

```
constructor(tokenAmountA: TokenAmount, tokenAmountB: TokenAmount)
```

使用范例

```
import { ChainId, Token, TokenAmount, Pair } from "@uniswap/sdk";

const HOT = new Token(
  ChainId.MAINNET,
  "0xc0FFee0000000000000000000000000000000000",
  18,
  "HOT",
  "Caffeine"
);
const NOT = new Token(
  ChainId.MAINNET,
  "0xDeCAf00000000000000000000000000000000000",
  18,
  "NOT",
  "Caffeine"
);

const pair = new Pair(
  new TokenAmount(HOT, "2000000000000000000"),
  new TokenAmount(NOT, "1000000000000000000")
);

```

**关键属性**

- **liquidityToken** -> 代表交易对流动性的 token
- token0
- token1
- reserve0
- reserve1

**方法**

- **reserveOf** -> 根据传入的 token 返回在 pair 中对应的余额
- getOutputAmount
- getInputAmount
- **getLiquidityMinted** -> 根据特定数量的 token0 和 token1 计算可铸造的流动性 token 的确切数量。
- **getLiquidityValue** -> 根据特定数量的流动性 token 计算所需的 token0 或 token1 的确切数量。

```
getLiquidityValue(
  token: Token,
  totalSupply: TokenAmount,
  liquidity: TokenAmount,
  feeOn: boolean = false,
  kLast?: BigintIsh
): TokenAmount
```

**静态方法**

- getAddress
  获取传入 token 的交易对地址
  ```
  getAddress(tokenA: Token, tokenB: Token): string
  ```

#### Route

```
constructor(pairs: Pair[], input: Token)
```

根据输入 token 和输出 token 参数，给出 input 到 output 的一个或者多个特定 Uniswap 交易对路径。

例子如下：

```
import { ChainId, Token, TokenAmount, Pair, Route } from "@uniswap/sdk";

const HOT = new Token(
  ChainId.MAINNET,
  "0xc0FFee0000000000000000000000000000000000",
  18,
  "HOT",
  "Caffeine"
);
const NOT = new Token(
  ChainId.MAINNET,
  "0xDeCAf00000000000000000000000000000000000",
  18,
  "NOT",
  "Caffeine"
);
const HOT_NOT = new Pair(
  new TokenAmount(HOT, "2000000000000000000"),
  new TokenAmount(NOT, "1000000000000000000")
);

const route = new Route([HOT_NOT], NOT);
```

**关键属性**

- **pairs** -> 经过排序后的交易路径中所有交易对
- **path** -> 从输入 token 到输出 token 的完整交易路径
- input
- output
- **midPrice** -> 返回交易路径过程中的中间价位

#### Trade

交易实体代表沿着特定 route 的执行一次 Tx，包含所有参数信息。

```
constructor(route: Route, amount: TokenAmount, tradeType: TradeType)
```

使用范例

```
import {
  ChainId,
  Token,
  TokenAmount,
  Pair,
  TradeType,
  Route,
} from "@uniswap/sdk";

const HOT = new Token(
  ChainId.MAINNET,
  "0xc0FFee0000000000000000000000000000000000",
  18,
  "HOT",
  "Caffeine"
);
const NOT = new Token(
  ChainId.MAINNET,
  "0xDeCAf00000000000000000000000000000000000",
  18,
  "NOT",
  "Caffeine"
);
const HOT_NOT = new Pair(
  new TokenAmount(HOT, "2000000000000000000"),
  new TokenAmount(NOT, "1000000000000000000")
);
const NOT_TO_HOT = new Route([HOT_NOT], NOT);

const trade = new Trade(
  NOT_TO_HOT,
  new TokenAmount(NOT, "1000000000000000"),
  TradeType.EXACT_INPUT
);
```

**关键属性**

- route
- tradeType
- inputAmount
- outputAmount
- **executionPrice** -> 交易执行时的平均价格
- **nextMidPrice** -> 如果交易执行，新的中间价位
- **slippage** -> 交易产生的滑点 ( 严格模式 > .30% )

**方法**

- minimumAmountOut（2.04 后）
- maximumAmountIn（2.04 后）

**静态方法**

- bestTradeExactIn

返回 TradeIn 方式的最大兑换数量结果（最低手续费），也就是最优兑换路径，包括 hop 数等，返回数据类型是 Trade 数组。
感谢三火 check 指正~！

```
Trade.bestTradeExactIn(
    pairs: Pair[],
    amountIn: TokenAmount,
    tokenOut: Token,
    { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {}): Trade[]
```

- bestTradeExactOut

#### Fractions

作为后续拓展的分数类的基类。**不能直接使用。**

```
constructor(numerator: BigintIsh, denominator: BigintIsh = ONE)
```

**关键属性**

都是 JSBI

- numerator
- denominator
- quotient

**方法**

- invert
- add
- subtract
- multiply
- divide
- **toSignificant** -> 将分数格式化为指定位数的有效数字
- **toFixed** -> 将分数格式化为指定的小数位数

---

这里开始的后续类都由 **Fractions** 类拓展而来：

- #### Percent
  格式化百分比

```
import { Percent } from "@uniswap/sdk";

const percent = new Percent("60", "100");
console.log(percent.toSignificant(2)); // 60
```

- toSignificant

- toFixed

* #### TokenAmount
  返回指定精度余额

```
import { Token, TokenAmount } from "@uniswap/sdk";

const FRIED = new Token(
  ChainId.MAINNET,
  "0xfa1aFe1000000000000000000000000000000000",
  18,
  "FRIED",
  "Beans"
);

const tokenAmount = new TokenAmount(FRIED, "3000000000000000000");
console.log(tokenAmount.toExact()); // 3
```

- add
- subtract
- toSignificant
- toFixed
- toExact

* #### Price
  返回相对价格

```
constructor(baseToken: Token, quoteToken: Token, denominator: BigintIsh, numerator: BigintIsh)
```

使用范例

```
import { ChainId, WETH as WETHs, Token, Price } from "@uniswap/sdk";

const WETH = WETHs[ChainId.MAINNET];
const ABC = new Token(
  ChainId.MAINNET,
  "0xabc0000000000000000000000000000000000000",
  18,
  "ABC"
);

const price = new Price(
  WETH,
  ABC,
  "1000000000000000000",
  "123000000000000000000"
);
console.log(price.toSignificant(3)); // 123
```

此示例显示 ETH/ABC 价格，其中 ETH 是基础 token，XYZ 是外部引用的 token。价格由 ABC（分子）数量/WETH（分母）数量构成。

静态方法

- fromRoute

属性

- baseToken
- quoteToken
- scalar：Fraction
- raw：Fraction
- adjusted：Fraction

方法：

- invert
- multiply
- quote
- toSignificant
- toFixed

---

#### Fetcher

静态方法包含了获取链上交易对和 token 的实例，不可通过构造实例化。

**fetchTokenData** -> 获取当前链上的 token 的数据

```
async fetchTokenData(
  chainId: ChainId,
  address: string,
  provider = getDefaultProvider(getNetwork(chainId)),
  symbol?: string,
  name?: string
): Promise<Token>
```

**fetchPairData** -> 获取当前交易对的数据

```
async fetchPairData(
  tokenA: Token,
  tokenB: Token,
  provider = getDefaultProvider(getNetwork(tokenA.chainId))
): Promise<Pair>
```

#### 其他导出的方法类

- JSBI
  [jsbi](https://github.com/GoogleChromeLabs/jsbi)的重导出

```
import { JSBI } from "@uniswap/sdk";
// import JSBI from 'jsbi'
```

- BigintIsh
  一个联合类型，由可以转换为 JSBI 实例的所有类型组成。
- ChainId

```
import { ChainId } from "@uniswap/sdk";
// enum ChainId {
//   MAINNET = 1,
//   ROPSTEN = 3,
//   RINKEBY = 4,
//   GÖRLI = 5,
//   KOVAN = 42
// }
```

- TradeType

```
import { TradeType } from "@uniswap/sdk";
// enum TradeType {
//   EXACT_INPUT,
//   EXACT_OUTPUT
// }
```

- Rounding

```
import { Rounding } from "@uniswap/sdk";
// enum Rounding {
//   ROUND_DOWN,
//   ROUND_HALF_UP,
//   ROUND_UP
// }
```

- FACTORY_ADDRESS
- INIT_CODE_HASH
- MINIMUM_LIQUIDITY
- InsufficientReservesError
- InsufficientInputAmountError
- WETH
  一个对象，以 ChainId 作为索引映射到相应的 WETH token实例
