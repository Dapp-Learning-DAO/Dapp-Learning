中文 / [English](./README.md)
# Brownie

[Brownie](https://github.com/eth-brownie/brownie) 是一个基于 Python 针对以太坊虚拟机的智能合约的开发和测试框架。

## Brownie 的使用

使用 Brownie 来运行 uniswapv1 的 test cases，基于 Brownie 的特性对原有的 uniswapv1 项目的 test 进行了重新编写，并且加入了详细的注释

### 安装 Brownie

- 安装依赖 Brownie

```sh
pip3 install eth-brownie
```

在终端中运行 brownie，应该可以看到类似下面这样的输出：

```sh
Brownie v1.18.1 - Python development framework for Ethereum
Usage:  brownie <command> [<args>...] [options <args>]

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

Type 'brownie <command> --help' for specific options and more information about
each command.
```

### Interacting with your Contracts

brownie 调试控制台，可以和链上合约进行交互操作

```sh
cd ./brownie_test
brownie console
```

brownie 会自动编译合约，并启动一个内置的 Ganache 本地测试网络，最后提供一个可实时交互的控制台

```sh
accounts[0]
# <Account '0x66aB6D9362d4F35596279692F0251Db635165871'>
```

我们尝试直接在控制部署一个 ERC20 token，并进行简单的交互

```sh
my_token = SimpleToken.deploy("DappLearning", "DL", 18, 0, {"from": accounts[0]})

# Transaction sent: 0x85f8c323e312cb49384eac81172de9bd54901a68d28263e22c3f4689af14d197
#   Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 0
#   SimpleToken.constructor confirmed - Block: 1   Gas used: 1843102 (15.36%)
#   SimpleToken deployed at: 0x3194cBDC3dbcd3E11a07892e7bA5c3394048Cc87
```

`my_token` 将缓存部署的token合约对象，我们来尝试进行交互

```sh
tx1=my_token.mint(accounts[0].address, 1000000*10**18, {'from': accounts[0]})
# Transaction sent: 0xcdd7...

tx1.events
# {'Transfer': [OrderedDict([('from', '0x0000000000000000000000000000000000000000'), ('to', '0x66aB6D9362d4F35596279692F0251Db635165871'), ('value', 1000000000000000000000000)])]}

history[-1]==tx1
# True

my_token.balanceOf(accounts[0].address)
# 1000000000000000000000000
```

### 编译合约

```sh
cd brownie_test
brownie compile
```

### 测试合约

```sh
brownie test
```

### 执行脚本

```sh
brownie run *.py --network kovan
```

## pytest

Brownie 推荐使用 pytest 编写测试案例。

- [pytest documents](https://docs.pytest.org/en/latest/)

### Brownie Pytest Fixtures

Fixtures 是 pytest 应用于一个或多个测试函数的函数，并在执行每个测试之前被调用。Fixtures 用于设置测试所需的初始条件。

Brownie 提供了简化与项目交互和测试的 Fixtures。大多数核心功能可以通过 Fixures 而不是 import 语句来访问。例如，这是使用 Brownie 的 Fixtures 而不是 import 的示例：

```python
import pytest

@pytest.fixture
def token(Token, accounts):
    return accounts[0].deploy(Token, "Dapp-Learning", "DL", 18, 1000)

def test_transfer(token, accounts):
    token.transfer(accounts[1], 100, {'from': accounts[0]})
    assert token.balanceOf(accounts[0]) == 900
```

### conftest.py

我们可以把通用的 Fixuters 函数放到 `conftest.py` 文件中，pytest 测试框架会在每个测试案例开始之前，自动加载其中的 Fixtures。

```python
# ./conftest.py

@pytest.fixture
def DL_token():
    SimpleToken.deploy("Dapp-Learning", "DL", 18, 0, {"from": accounts[0]})
   ...
```

```python
# ./test_eth_to_token.py

def test_eth_to_token_swap(DL_token):
    DL_token.approve(some_address, 10 * 10**18, {"from": accounts[0]})
    ...
```


## 参考链接

- brownie 官网: <https://eth-brownie.readthedocs.io/en/stable/toctree.html>
- 旧版 Uniswap 合约: <https://github.com/Uniswap/old-solidity-contracts>
- Uniswap V1 合约: <https://github.com/Uniswap/uniswap-v1/tree/master/tests>
- brownie pdf 文档: <https://readthedocs.org/projects/eth-brownie/downloads/pdf/v1.3.1_a/>
- pytest 教程: <https://zhuanlan.zhihu.com/p/87775743>
- vyper 官网: <https://vyper.readthedocs.io/en/stable>
- Brownie Tutorial by Curve Finance： <https://www.youtube.com/watch?v=nkvIFE2QVp0&list=PLVOHzVzbg7bFUaOGwN0NOgkTItUAVyBBQ>
