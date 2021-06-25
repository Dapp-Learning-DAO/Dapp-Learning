import pytest
from web3 import Web3
from web3.contract import ConciseContract
from brownie import TestToken, accounts

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
def HAY_token(w3):
    t = TestToken.deploy("HAYAHEI", "HAY", 18, {"from": accounts[0]})
    # print(w3.eth.default_account)
    # print(w3.eth.accounts[0])
    # print(accounts[0])

    # mint 500 to account0 and account1, respectively
    t.mint(accounts[0], 500 * 10**18, {"from": accounts[0]})
    t.mint(accounts[1], 500 * 10**18, {"from": accounts[0]})

    # x = t.balanceOf(accounts[0])
    # print(x)
    return t