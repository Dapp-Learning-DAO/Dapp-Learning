import pytest
from web3 import Web3
from web3.contract import ConciseContract
from brownie import SimpleToken, UniswapFactory, accounts

# reference to .
# https://github.com/Uniswap/uniswap-v1/blob/master/tests/conftest.py
# brownie made the contract deploying thing easier but hard to understand

@pytest.fixture
def w3():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    # w3.eth.setGasPriceStrategy(lambda web3, params: 0)
    # w3.eth.defaultAccount = w3.eth.accounts[0]
    # print(w3.eth.default_account)
    return w3


@pytest.fixture
def HAY_token():
    t = SimpleToken.deploy("HAYAHEI", "HAY", 18, 0, {"from": accounts[0]})
    # print(w3.eth.accounts[0])

    # mint 500 to account0 and account1, respectively
    t.mint(accounts[0], 500 * 10**18, {"from": accounts[0]})
    t.mint(accounts[1], 500 * 10**18, {"from": accounts[0]})

    return t


@pytest.fixture
def BEE_token():
    t = SimpleToken.deploy("BEEEEEE", "BEE", 18, 0, {"from": accounts[0]})
    # print(w3.eth.accounts[0])

    # mint 500 to account0 and account1, respectively
    t.mint(accounts[0], 500 * 10**18, {"from": accounts[0]})
    t.mint(accounts[1], 500 * 10**18, {"from": accounts[0]})

    return t


@pytest.fixture
def uniswap_factory():
    t = UniswapFactory.deploy({"from": accounts[0]})

    return t