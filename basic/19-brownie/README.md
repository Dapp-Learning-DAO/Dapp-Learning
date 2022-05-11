# Brownie

[Brownie](https://github.com/eth-brownie/brownie) is a Python-based smart contract development and testing framework for the Ethereum Virtual Machine.

## Usage of Brownie
Use Brownie to run the test cases of uniswapv1, based on the features of Brownie rewrite the test of the original uniswapv1 project, and add detailed comments

### Install Brownie

- Install dependencies Brownie

```sh
pip3 install eth-brownie
```

Run the` brownie` command in the terminal and you should see an output similar to the following:
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

brownie debug console that can interact with on-chain contracts

```sh
cd ./brownie_test
brownie console
```

brownie will automatically compile the contract, start a built-in Ganache local test network, and provide a live interactive console finally

```sh
accounts[0]
# <Account '0x66aB6D9362d4F35596279692F0251Db635165871'>
```

Let's try to deploy an ERC20 token right in the control and perform simple interactions

```sh
my_token = SimpleToken.deploy("DappLearning", "DL", 18, 0, {"from": accounts[0]})

# Transaction sent: 0x85f8c323e312cb49384eac81172de9bd54901a68d28263e22c3f4689af14d197
#   Gas price: 0.0 gwei   Gas limit: 12000000   Nonce: 0
#   SimpleToken.constructor confirmed - Block: 1   Gas used: 1843102 (15.36%)
#   SimpleToken deployed at: 0x3194cBDC3dbcd3E11a07892e7bA5c3394048Cc87
```

`my_token` will cache the deployed token contract object, and now we try to interact

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

### Compile the contract

```sh
cd brownie_test
brownie compile
```

### Test contract

```sh
brownie test
```

### execute script

```sh
brownie run *.py --network kovan
```

## pytest

Brownie recommends using pytest to write test cases.

- [pytest documents](https://docs.pytest.org/en/latest/)

### Brownie Pytest Fixtures

Fixtures are functions that pytest applies to one or more test functions and are called before each test is executed. Fixtures are used to set the initial conditions required for testing.

Brownie provides Fixtures that simplify interaction and testing with projects. Most of the core functionality can be accessed through Fixures instead of import statements. Here's an example using Brownie's Fixtures instead of import:

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

We can put the generic Fixuters function in the `conftest.py` file, and the pytest testing framework will automatically load the Fixtures in it before each test case starts.

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

## Reference link

- brownie official website: <https://eth-brownie.readthedocs.io/en/stable/toctree.html>
- Previous Uniswap contracts: <https://github.com/Uniswap/old-solidity-contracts>
- Uniswap V1 contract: <https://github.com/Uniswap/uniswap-v1/tree/master/tests>
- brownie pdf documentation: <https://readthedocs.org/projects/eth-brownie/downloads/pdf/v1.3.1_a/>
- pytest tutorial: <https://zhuanlan.zhihu.com/p/87775743>
- vyper official website: <https://vyper.readthedocs.io/en/stable>
- Brownie Tutorial by Curve Finance: <https://www.youtube.com/watch?v=nkvIFE2QVp0&list=PLVOHzVzbg7bFUaOGwN0NOgkTItUAVyBBQ>

