# starkNet

## intro

StarkNet 是一个无需许可的去中心化 ZK-Rollup，作为以太坊上的 L2 网络运行，任何 dApp 都可以在不影响以太坊的可组合性和安全性的情况下实现无限规模的计算。

`Cairo` 是一种用于编写可证明程序的编程语言，其中一方可以向另一方证明某个计算已正确执行。

StarkNet 将 Cairo 编程语言用于其基础设施和编写 StarkNet 合约。

## Setting up the environment

具体安装可以查看官方文档，这里以 Mac (M1 芯片) 环境为例

1. 为 Cairo 创建一个独立的 python 虚拟环境

   ```sh
   python3.7 -m venv ~/cairo_venv
   source ~/cairo_venv/bin/activate
   ```

   建议使用 python3.7 版本，其他版本可能有依赖安装问题

2. 安装 pip 依赖

   ```sh
   pip3 install ecdsa fastecdsa sympy
   ```

   mac m1 芯片安装 fastecdsa 可能会报错，可以按照这里的办法安装

   <https://github.com/AntonKueltz/fastecdsa/issues/74>

   ```sh
   arch -arm64 brew install gmp

   CFLAGS=-I/opt/homebrew/opt/gmp/include LDFLAGS=-L/opt/homebrew/opt/gmp/lib python3 -m pip install --no-binary :all: --no-use-pep517 fastecdsa
   ```

3.

## reference

- official website <https://starkware.co/starknet/>
- develop docs <https://starknet.io/docs/index.html>
