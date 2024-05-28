# 简介

区块链作为对等网络中的一种分布式账本技术，集成了密码学、共识机制、智能合约等多种技术，提供一种新型信任体系构建方法。智能合约具有公开透明、实时更新、准确执行等显著特点，在区块链中为信息存储、交易执行和资产管理等功能的实现提供了更安全、高效、可信的方式。但是，智能合约本身仍然存在安全问题，影响了区块链技术的进一步推广使用。  
本章节介绍几种安全分析工具, 帮忙开发者在开发 solidity 合约时, 及时发现并检测其中的漏洞

## Mythril

Mythril 是一个以太坊官方推荐的智能合约安全分析工具，使用符合执行来检测智能合约中的各种安全漏洞，在 Remix、Truffle 等 IDE 里都有集成。
其包含的安全分析模型如下,具体可参考 [链接](https://learnblockchain.cn/article/1283)  

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/50-solidity-security/securityModule.png?raw=true" /></center>

- 安装 ( docker 方式 )

```shell
docker pull mythril/myth
```

- 进行检查

```shell
docker run -v ${PWD}:/contract mythril/myth analyze  /contract/Overflow_Add.sol --solv 0.4.25
```

之后可以得到如下输出

```shell
❯ docker run -v ${PWD}:/contract mythril/myth analyze  /contract/Overflow_Add.sol --solv 0.4.25
==== Integer Arithmetic Bugs ====
SWC ID: 101
Severity: High
Contract: Overflow_Add
Function name: fallback
PC address: 143
Estimated Gas Usage: 5954 - 26049
The arithmetic operator can overflow.
It is possible to cause an integer overflow or underflow in the arithmetic operation.
--------------------
In file: /contract/Overflow_Add.sol:6

balance += deposit

--------------------
Initial State:

Account: [CREATOR], balance: 0x1, nonce:0, storage:{}
Account: [ATTACKER], balance: 0x0, nonce:0, storage:{}
Account: [SOMEGUY], balance: 0x0, nonce:0, storage:{}

Transaction Sequence:

Caller: [CREATOR], calldata: , value: 0x0
Caller: [ATTACKER], function: add(uint256), txdata: 0x1003e2d2ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff, value: 0x0
```

## Oyente

这个工具比较旧了, 目前使用的 solidity 编译器版本为 0.4.21, 但作为一个安全工具, 我们还是可以去了解下如何使用它

- 安装 && 启动

```shell
docker pull luongnguyen/oyente && docker run -i -t luongnguyen/oyente
```

- 执行测试

```shell
cd /oyente/oyente && python oyente.py -s greeter.sol
```

## Slither

Slither 是一个用 Python 3 编写的智能合约静态分析框架，提供如下功能：

1. 自动化漏洞检测。提供超 30 多项的漏洞检查模型，模型列表详见: https://github.com/crytic/slither#detectors

2. 自动优化检测。Slither 可以检测编译器遗漏的代码优化项并给出优化建议

3. 代码理解。Slither 能够绘制合约的继承拓扑图，合约方法调用关系图等，帮助开发者理解代码

4. 辅助代码审查。用户可以通过 API 与 Slither 进行交互
- 安装 ( docker 方式 )

```shell
docker pull trailofbits/eth-security-toolbox
```

- 登陆容器

```shell
docker run -it -v ${PWD}:/contracts trailofbits/eth-security-toolbox
```

- 进行检查

```shell
cd /contracts
slither Suicidal.sol --solc /usr/bin/solc-v0.5.13
```

输入结果如下

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/50-solidity-security/slither.png?raw=true" /></center>

- [可选] 使用 [solc-select](https://github.com/crytic/solc-select) 切换/管理solidity(solc)版本 
  
  - 安装
    
    ```shell
        pip3 install solc-select
    ```
  
  - 安装需要的版本 & 使用需要的版本
    
    ```shell
        solc-select install 0.8.17
        solc-select use 0.8.17
        solc --version
    ```
  
  - 使用slither（无需版本声明）
    
    ```shell
        cd /contracts
        slither MyContract.sol
    ```

## MythX

mythX 是一个付费工具, 支持命令行, vscode 插件等形式进行分析.  
可参考 [官网](https://docs.mythx.io/) 操作指导进行操作.  
进行正确配置后, 就可以进行 solidity 文件漏洞扫描了, 这里以 vscode 为例, 扫描结果如下.  
总的来说, 毕竟是付费的, 体验还是很不错的 ^\_^

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/50-solidity-security/scanResult.png?raw=true" /></center>

## Solgraph

合约中会存在很多的方法, 特别是一些大型商业合约, 方法相互嵌套, 很容易令人迷惑. [SolGraph](https://github.com/raineorshine/solgraph) 就是用于展示合约方法之间相互关系的一个工具, 使用这个这个工具, 可以清晰的展示合约方法之间的调用关系.

- 安装 solgraph

```shell
yarn global add solgraph
```

- 安装 graphviz ( 以 macos 为例 )

```shell
brew install graphviz
```

- 进行分析

```shell
solgraph GraphContract.sol > GraphContract.dot
```

- 转换分析结果为图片

```shell
dot -Tpng GraphContract.dot -o GraphContract.png
```

## [manticore](https://github.com/trailofbits/manticore)

manticore 是基于**符号执行**方法的合约分析工具，它实际上也是通过断言，来判断是否满足某种属性。

- 特点：
1. 给定输入，搜索可能的状态。

2. 自动生成输入信息。

3. 检测执行失败或者崩溃的地方。

4. 通过事件或者指令钩子，更精确的控制搜索路径。
- 安装：

```bash
pip install "manticore[native]"
```

> 如果运行 manticore 报错，请复制最后一行的提示信息，在谷歌搜索。大概率是依赖包版本问题。

> 注意：由于遍历或者搜索的效率其实比较慢，可能需要运行很久。

运行后将会生成很多辅助分析的材料，如何分析请见该[项目文档](https://github.com/trailofbits/manticore/wiki/What's-in-the-workspace%3F)。除此之外，也可以**高度自定义，编写 python 代码，初始化合约状态，然后再检查不变量**。

- 检测漏洞：

类似于断言的方法，判断合约是否满足某个属性，详细操作间见[文档](https://manticore.readthedocs.io/en/latest/verifier.html)。

## [scribble](https://github.com/ConsenSys/scribble)

也是基于断言的审计工具，但是比较特殊的是，他可以很方便的扫描链上的合约，然后寻找漏洞。它自称是“基于属性的运行时验证工具”，我暂时还不清楚它使用的原理。感兴趣可以深入阅读[它的文档](https://docs.scribble.codes/)。

## [Legions](https://github.com/ConsenSys/Legions)

他主要是提供了语法糖，可以简化节点的查询工作，比如不用每次查询余额都要写一串的 web3。

## [vscode-solidity-auditor](https://github.com/ConsenSys/vscode-solidity-auditor)

这是一个 vscode 的插件，通过可视化的方式辅助分析合约。建议使用时换成它自定义的主题，可能显示效果会好一些。使用方法请看标题的官方网站，介绍的很清楚，也有动图演示。

## [Aderyn](https://github.com/Cyfrin/aderyn)

Aderyn是一个用 Rust 编写的开源 solidity 智能合约静态分析框架，可以快速检测潜在漏洞，生成分析报告，使安全审计人员有时间专注于更复杂的漏洞。

Aderyn可以根据需要构建自定义检测器，具体参考[Detectors Quickstart](https://docs.cyfrin.io/aderyn-custom-detectors/detectors-quickstart)。

- 安装：

```bash
cargo install aderyn
```

- 使用：

```bash
aderyn path/to/your/project
```

- 举例（Overflow_Add.sol）：

```bash
aderyn Overflow_Add.sol
```

分析报告见[report.md](report.md)

## 参考链接

- https://learnblockchain.cn/eth/dev/%E5%AE%89%E5%85%A8%E5%88%86%E6%9E%90.html
- https://zhuanlan.zhihu.com/p/164693789
- http://blog.hubwiz.com/2020/05/11/mythril-tutorial/
- https://learnblockchain.cn/article/3834
