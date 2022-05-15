from brownie import (accounts, web3)


def test_token_to_eth_swap(HAY_token, hay_token_exchange):
    HAY_token.approve(hay_token_exchange, 10 * 10 ** 18, {"from": accounts[0]})

    # step 1: initialize exchange
    hay_token_exchange.initializeExchange(10 * 10 ** 18, {"from": accounts[0], "amount": 5 * 10 ** 18})

    # the swap function needs a timeout parameter
    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300

    # step 2: 用account[1]的token来进行token 2 eth的操作
    HAY_token.approve(hay_token_exchange, 2 * 10 ** 18, {"from": accounts[1]})
    account1_eth_balance = accounts[1].balance()

    assert HAY_token.balanceOf(accounts[1]) == 500 * 10**18

    # step 2: call the swap function
    hay_token_exchange.tokenToEthSwap(2 * 10**18, 1, timeout, {"from": accounts[1]})
    # 参考eth_to_token中手续费等参数的计算流程，只不过这里收取的手续费是Token，同样是0.2%
    # a) fee = token_to_swap * 0.2% = 4000000000000000
    # b) Eth pool = invariant / (Token pool - fee) = 10 * 10**18 * 5 * 10**18 / (11.996 * 10**18)
    #               = 4168056018672890963
    # c) Eth returned = eth original pool - Eth Pool = 5 * 10**18 - 4168056018672890963
    #                   = 831943981327109037
    # d) 更新所有变量
    #       Eth pool = 4168056018672890963
    #       Token pool = 12 * 10**18
    #       invariant = Eth pool * Token pool = 50016672224074691556000000000000000000
    #       Eth bought = 831943981327109037
    #       Token in = 2 * 10**18
    assert hay_token_exchange.tokenPool() == 12 * 10**18
    assert HAY_token.balanceOf(hay_token_exchange) == 12 * 10**18
    assert hay_token_exchange.ethPool() == 4168056018672890963
    assert web3.eth.getBalance(hay_token_exchange.address) == 4168056018672890963
    assert hay_token_exchange.invariant() == 50016672224074691556000000000000000000
    assert accounts[1].balance() == account1_eth_balance + 831943981327109037
    assert HAY_token.balanceOf(accounts[1]) == 498 * 10**18


def test_token_to_eth_payment(HAY_token, hay_token_exchange):
    HAY_token.approve(hay_token_exchange, 10 * 10 ** 18, {"from": accounts[0]})

    # step 1: initialize exchange
    hay_token_exchange.initializeExchange(10 * 10 ** 18, {"from": accounts[0], "amount": 5 * 10 ** 18})

    # the swap function needs a timeout parameter
    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300

    # step 2: 用account[1]的token来进行token 2 eth的操作, receipt为account[2]
    HAY_token.approve(hay_token_exchange, 2 * 10 ** 18, {"from": accounts[1]})
    account2_eth_balance = accounts[2].balance()

    assert HAY_token.balanceOf(accounts[1]) == 500 * 10 ** 18
    assert HAY_token.balanceOf(accounts[2]) == 0

    # step 2: call the payment function
    hay_token_exchange.tokenToEthPayment(2 * 10**18, 1, timeout, accounts[2], {"from": accounts[1]})

    assert hay_token_exchange.tokenPool() == 12 * 10 ** 18
    assert HAY_token.balanceOf(hay_token_exchange) == 12 * 10 ** 18
    assert hay_token_exchange.ethPool() == 4168056018672890963
    assert web3.eth.getBalance(hay_token_exchange.address) == 4168056018672890963
    assert hay_token_exchange.invariant() == 50016672224074691556000000000000000000
    assert accounts[2].balance() == account2_eth_balance + 831943981327109037
    assert HAY_token.balanceOf(accounts[1]) == 498 * 10 ** 18
