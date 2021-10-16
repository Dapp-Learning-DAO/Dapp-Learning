### 背景

+ 看了下V2 SDK，核心是为满足部分请求、操作链上数据场景的公共需求而设计，服务于基于UniSwap构建应用场景，或者一些快速开发的Hackthon场景，因此直接选取官方版本。
+ 从Quick start开始给大家做介绍。

#### SDK结构

+ 核心是三个部分：pair、route、trade，服务于外部业务的调用，提供Token信息、交易对输入输出信息、交易过程数据、最优路径等等方面功能服务。

#### Start

+ https://docs.uniswap.org/sdk/2.0.0/guides/quick-start

+ yarn add @uniswap/sdk
+ 目前两个场景获取链上信息
+ 1.获取/操作Token相关信息/数据
+ 必填参数3个： **chainId**, a **token address**, and how many **decimals** 
+ 扩展：Token **symbol** and/or **name** of the token

```
import { ChainId, Token } from "@uniswap/sdk";

const chainId = ChainId.MAINNET;
const tokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI,must be checksummed
const decimals = 18; //精度

const DAI = new Token(chainId, tokenAddress, decimals);
```

#### 获取数据
1.直接获取Token数据

使用SDK获取

2.获取交易对数据

需要客户提供数据基础上获取，多个场景需要

#### 价格

价格分为Mid Price 和Excution Price。

对于Mid Price，是反应一个或多个交易对保有率（ratio of reserves）的价格。

以DAI-WETH为例：

1.直接获取价格（交易对的）
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
2.间接获取
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
对于执行价格（真实价格），作为交易的执行价格，是一个sent比received的比率（he ratio of assets sent/received）。

以一个1 WETH for DAI的交易为例：
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
1.直接发送交易到Router:
1 WETH 兑换尽可能多的 DAI 
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

2.create2获取

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
SDK的依赖是点依赖，就是你如果没有单独安装，则需要单独安装，如果整体安装了，也就不需要了。

1. prevent installation of unused dependencies (e.g. @ethersproject/providers and @ethersproject/contracts, only used in Fetcher)

2. prevent duplicate @ethersproject dependencies with conflicting versions.
简单来看，遇到依赖了yarn装下就行，我是这样理解的。

以下是SDK的关键实体的使用：
#### Token
Token的定义
```
constructor(chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string)
```
特定链的特定地址的Token，ERC20
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

+ chainId
+ address
+ decimals
+ symbol
+ name
+ 
**方法包括**

+ equals
+ 判断是不是一个币
+ sortsBefore
  按地址排序下判断相对位置


#### Pair
交易对实体，代表一个uni交易对，以及对应的每个token的余额
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

+ liquidityToken
+ token0
+ reserve0
+ reserve1
+ 

**方法**

+ reserveOf（返回reserve0或者1余额，看传参）
+ getOutputAmount
+ getInputAmount
+ getLiquidityMinted
+ getLiquidityValue
+ 计算总体流动性

```
getLiquidityValue(
  token: Token,
  totalSupply: TokenAmount,
  liquidity: TokenAmount,
  feeOn: boolean = false,
  kLast?: BigintIsh
): TokenAmount
```

静态方法：getAddress

+ 获得交易对方法

```
getAddress(tokenA: Token, tokenB: Token): string
```


#### Route
```
constructor(pairs: Pair[], input: Token)
```

根据输入token和输出token参数，给出input到output的一个或者多个特定uni交易对路径。

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

+ pairs
+ path
+ input
+ output
+ midPrice

#### Trade
交易实体代表沿着特定route的一次Tx，包含所有参数信息。

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

+ route
+ tradeType
+ inputAmount
+ outputAmount
+ executionPrice
+ nextMidPrice
+ slippage

**方法**

+ minimumAmountOut（2.04后）
+ maximumAmountIn（2.04后）


Static methods:

+ bestTradeExactIn

返回TradeIn方式的最大兑换数量结果（最低手续费），也就是最优兑换路径，包括hop数等，返回数据类型是Trade数组。
感谢三火check指正~！

```
Trade.bestTradeExactIn(
    pairs: Pair[],
    amountIn: TokenAmount,
    tokenOut: Token,
    { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {}): Trade[]
```
+ bestTradeExactOut


#### Fractions
所有并发分式都继承与此,不意味着可以直接使用。
```
constructor(numerator: BigintIsh, denominator: BigintIsh = ONE)
```

**关键属性**

都是JSBI

+ numerator
+ denominator
+ quotient


**方法**

+ invert
+ add
+ subtract
+ multiply
+ divide
+ toSignificant
+ toFixed


Percent：格式化百分比
```
import { Percent } from "@uniswap/sdk";

const percent = new Percent("60", "100");
console.log(percent.toSignificant(2)); // 60
```
+ toSignificant

+ toFixed

TokenAmount:返回指定精度余额

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
+ add
+ subtract
+ toSignificant
+ toFixed
+ toExact

Price:返回相对价格
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
 XYZ (分子) / an amount of WETH (分母）
 
 静态方法

 + fromRoute

 属性

+ baseToken
+ quoteToken
+ scalar：Fraction
+ raw：Fraction
+ adjusted：Fraction
  
 方法：

+ invert
+ multiply
+ quote
+ toSignificant
+ toFixed

#### Fetcher
静态方法包含了获取链上交易对和token的实例，不可构造。

fetchTokenData
```
async fetchTokenData(
  chainId: ChainId,
  address: string,
  provider = getDefaultProvider(getNetwork(chainId)),
  symbol?: string,
  name?: string
): Promise<Token>
```

fetchPairData
```
async fetchPairData(
  tokenA: Token,
  tokenB: Token,
  provider = getDefaultProvider(getNetwork(tokenA.chainId))
): Promise<Pair>
```


#### Other Exports 
+ 1.JSBI
```
import { JSBI } from "@uniswap/sdk";
// import JSBI from 'jsbi'
```
+ 2.BigintIsh
+ 3.ChainId
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
4.TradeType
```
import { TradeType } from "@uniswap/sdk";
// enum TradeType {
//   EXACT_INPUT,
//   EXACT_OUTPUT
// }
```

+ 5.Rounding
```
import { Rounding } from "@uniswap/sdk";
// enum Rounding {
//   ROUND_DOWN,
//   ROUND_HALF_UP,
//   ROUND_UP
// }
```
+ 6.FACTORY_ADDRESS
+ 7.INIT_CODE_HASH
+ 8.MINIMUM_LIQUIDITY
+ 9.InsufficientReservesError
+ 10.InsufficientInputAmountError
+ 11.WETH
