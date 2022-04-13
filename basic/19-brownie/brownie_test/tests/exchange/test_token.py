from brownie import (accounts, web3)


def test_initial_state(HAY_token):
    assert HAY_token.name() == 'HAYAHEI'
    assert HAY_token.symbol() == 'HAY'
    assert HAY_token.decimals() == 18
    assert HAY_token.totalSupply() == 1000 * 10**18


def test_ERC20(HAY_token):
    a0 = accounts[0]
    a1 = accounts[1]
    assert HAY_token.decimals() == 18
    assert HAY_token.totalSupply() == 1000*10**18
    assert HAY_token.balanceOf(a0) == 500*10**18
    HAY_token.transfer(a1, 1*10**18, {"from": accounts[0]})
    assert HAY_token.balanceOf(a0) == 499*10**18
    assert HAY_token.balanceOf(a1) == 501*10**18


def test_transfer_approval(HAY_token):
    uni_token = HAY_token

    assert uni_token.balanceOf(accounts[0]) == 500 * 10**18
    assert uni_token.balanceOf(accounts[1]) == 500 * 10**18

    uni_token.approve(accounts[2], 200 * 10**18, {"from": accounts[0]})
    uni_token.transferFrom( accounts[0], accounts[9], 5 * 10**18, {"from": accounts[2]})
    assert uni_token.balanceOf(accounts[0]) == 495 * 10**18
    assert uni_token.balanceOf(accounts[9]) == 5 * 10**18
