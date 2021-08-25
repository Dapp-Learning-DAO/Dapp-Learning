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

+ 2.获取交易对数据

