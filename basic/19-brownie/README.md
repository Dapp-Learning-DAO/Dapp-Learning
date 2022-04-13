# Brownie 的使用

本项目使用 Brownie 来运行 uniswapv1 的 test cases，基于 brownie 的特性对原有的 uniswapv1 项目
的 test 进行了重新编写，并且加入了详细的注释

## 安装 Brownie

- 安装依赖 Brownie

```sh
pip3 install eth-brownie
```

在终端中运行 brownie，应该可以看到类似下面这样的输出：

```sh
Brownie v1.13.0 - Python development framework for Ethereum
Usage:  brownie &lt;command> [&lt;args>...] [options &lt;args>]

Commands:

  init               Initialize a new brownie project
  bake               Initialize from a brownie-mix template
  pm                 Install and manage external packages
  compile            Compile the contract source files
  console            Load the console
  test               Run test cases in the tests/ folder
  run                Run a script in the scripts/ folder
  accounts           Manage local accounts
  networks           Manage network settings
  gui                Load the GUI to view opcodes and test coverage
  analyze            Find security vulnerabilities using the MythX API

Options:

  --help -h          Display this message
  --version          Show version and exit

Type 'brownie &lt;command> --help' for specific options and more information about
each command.
```

## 安装 Ganache

```sh
npm install -g ganache-cli
```

## 启动 Ganache

开启单独的一个窗口, 在其中启动 Ganache

```sh
ganache-cli
```

## 编译合约

```
cd brownie_test
brownie compile
```

## 测试合约

```
brownie test
```

## 执行脚本

```sh
brownie run *.py --network kovan
```

## 参考链接

- brownie 官网: <https://eth-brownie.readthedocs.io/en/stable/toctree.html>
- 旧版 Uniswap 合约: <https://github.com/Uniswap/old-solidity-contracts>
- Uniswap V1 合约: <https://github.com/Uniswap/uniswap-v1/tree/master/tests>
- brownie pdf 文档: <https://readthedocs.org/projects/eth-brownie/downloads/pdf/v1.3.1_a/>
- pytest 教程: <https://zhuanlan.zhihu.com/p/87775743>
- vyper 官网: <https://vyper.readthedocs.io/en/stable>
- Brownie Tutorial by Curve Finance： <https://www.youtube.com/watch?v=nkvIFE2QVp0&list=PLVOHzVzbg7bFUaOGwN0NOgkTItUAVyBBQ>
