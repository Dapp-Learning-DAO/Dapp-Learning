from brownie import (accounts, web3)
import brownie


def test_token_to_token_swap(HAY_token, BEE_token, hay_token_exchange, bee_token_exchange):

    HAY_token.approve(hay_token_exchange, 10 * 10**18, {"from": accounts[0]})
    BEE_token.approve(bee_token_exchange, 20 * 10**18, {"from": accounts[1]})

    # step1: initialize the two Exchanges
    hay_token_exchange.initializeExchange(10 * 10**18, {"from": accounts[0], "amount": 5 * 10**18})
    bee_token_exchange.initializeExchange(20 * 10**18, {"from": accounts[1], "amount": 5 * 10**18})

    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300

    # for simplicity, mint some coin to accounts[2] which has 0 coin right now
    assert HAY_token.balanceOf(accounts[2]) == 0
    HAY_token.mint(accounts[2], 2 * 10**18)
    HAY_token.approve(hay_token_exchange, 2 * 10**18, {"from": accounts[2]})

    assert HAY_token.balanceOf(accounts[2]) == 2 * 10**18
    assert BEE_token.balanceOf(accounts[2]) == 0

    # this should not change after swapping
    account2_eth_balance = accounts[2].balance()

    # step 2: call the swap func
    hay_token_exchange.tokenToTokenSwap(BEE_token, 2 * 10**18, 1, timeout, {"from": accounts[2]})
    # token2token可以分为两个部分来看，第一个部分是在当前的exchange中把hay_token换成ETH
    # 但是该ETH不是返回给调用者，而是再去Exchange2中去购买bee_token，最后bee_token返回给最终的receipt
    # 所以该过程的手续费是先收取0.2%的token1, 然后在在中间返回的ETH上收取0.2%的ETH，手续费分别是发给两个exchange

    # step 2-1: 可以参考token2Eth的test函数，这里不赘述
    assert hay_token_exchange.tokenPool() == 12 * 10 ** 18
    assert HAY_token.balanceOf(hay_token_exchange) == 12 * 10 ** 18
    assert hay_token_exchange.ethPool() == 4168056018672890963
    assert web3.eth.getBalance(hay_token_exchange.address) == 4168056018672890963
    assert hay_token_exchange.invariant() == 50016672224074691556000000000000000000
    assert HAY_token.balanceOf(accounts[2]) == 0

    eth_intermediate_balance = 831943981327109037

    # step 2-2: 在exchange1中间得到了831943981327109037的ETH，用该数量的eth去购买bee_token
    # a) fee = 831943981327109037 * 0.2% = 1663887962654218
    # b) Token pool = invariant / (Eth pool - fee)
    #               = int(20 * 10**18 * 5 * 10**18) // int(5 * 10**18 + 831943981327109037 - 1663887962654218)
    #               = 17151834628633326487
    # c) Token purchased = 20 * 10**18 - 17151834628633326487 = 2848165371366673513
    # d) 更新所有变量
    #       invariant = 17151834628633326487 * (5 * 10**18 + 831943981327109037)
    #                   = 100028538731176018770023024800269163019
    #       Token pool = 17151834628633326487
    #       Eth Pool = 5831943981327109037
    assert bee_token_exchange.ethPool() == 5831943981327109037
    assert bee_token_exchange.tokenPool() == 17151834628633326487
    assert bee_token_exchange.invariant() == 100028538731176018770023024800269163019
    assert BEE_token.balanceOf(bee_token_exchange) == 17151834628633326487
    assert web3.eth.getBalance(bee_token_exchange.address) == 5831943981327109037

    assert BEE_token.balanceOf(accounts[2]) == 2848165371366673513
    assert accounts[2].balance() == account2_eth_balance


def test_token_to_token_payment(HAY_token, BEE_token, hay_token_exchange, bee_token_exchange):
    HAY_token.approve(hay_token_exchange, 10 * 10 ** 18, {"from": accounts[0]})
    BEE_token.approve(bee_token_exchange, 20 * 10 ** 18, {"from": accounts[1]})

    # step1: initialize the two Exchanges
    hay_token_exchange.initializeExchange(10 * 10 ** 18, {"from": accounts[0], "amount": 5 * 10 ** 18})
    bee_token_exchange.initializeExchange(20 * 10 ** 18, {"from": accounts[1], "amount": 5 * 10 ** 18})

    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300

    # for simplicity, mint some coin to accounts[2] which has 0 coin right now
    assert HAY_token.balanceOf(accounts[2]) == 0
    HAY_token.mint(accounts[2], 2 * 10 ** 18)
    HAY_token.approve(hay_token_exchange, 2 * 10 ** 18, {"from": accounts[2]})

    assert HAY_token.balanceOf(accounts[2]) == 2 * 10 ** 18
    assert BEE_token.balanceOf(accounts[2]) == 0
    assert HAY_token.balanceOf(accounts[3]) == 0
    assert BEE_token.balanceOf(accounts[3]) == 0

    # this should not change after swapping
    account2_eth_balance = accounts[2].balance()
    account3_eth_balance = accounts[3].balance()

    # step 2: call the swap func
    hay_token_exchange.tokenToTokenPayment(BEE_token, accounts[3], 2 * 10 ** 18, 1, timeout, {"from": accounts[2]})

    assert hay_token_exchange.tokenPool() == 12 * 10 ** 18
    assert HAY_token.balanceOf(hay_token_exchange) == 12 * 10 ** 18
    assert hay_token_exchange.ethPool() == 4168056018672890963
    assert web3.eth.getBalance(hay_token_exchange.address) == 4168056018672890963
    assert hay_token_exchange.invariant() == 50016672224074691556000000000000000000

    eth_intermediate_balance = 831943981327109037

    assert bee_token_exchange.ethPool() == 5831943981327109037
    assert bee_token_exchange.tokenPool() == 17151834628633326487
    assert bee_token_exchange.invariant() == 100028538731176018770023024800269163019
    assert BEE_token.balanceOf(bee_token_exchange) == 17151834628633326487
    assert web3.eth.getBalance(bee_token_exchange.address) == 5831943981327109037

    assert HAY_token.balanceOf(accounts[2]) == 0
    assert HAY_token.balanceOf(accounts[3]) == 0
    assert BEE_token.balanceOf(accounts[2]) == 0
    assert BEE_token.balanceOf(accounts[3]) == 2848165371366673513
    assert accounts[2].balance() == account2_eth_balance
    assert accounts[3].balance() == account3_eth_balance
