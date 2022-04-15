from brownie import (accounts, web3)
import brownie


def test_initialize_exchange(HAY_token, hay_token_exchange):
    # to initialize the Exchange,
    # need to send msg.value ETH and some amount of TOKEN
    # from any address
    HAY_token.approve(hay_token_exchange, 10 * 10**18, {"from": accounts[0]})
    assert HAY_token.balanceOf(accounts[0]) == 500 * 10**18

    hay_token_exchange.initializeExchange(10 * 10 ** 18, {"from": accounts[0], "amount": 5 * 10 ** 18})
    with brownie.reverts():
        # the amount of ETH should not bigger than 5 * 10**18, as defined in the requires
        hay_token_exchange.initializeExchange(10 * 10**18, {"from": accounts[0], "amount": 6 * 10**18})

    # print(hay_token_exchange)

    # the initial share is 1000
    # k = x * y
    # x, y = 10*10**18, 5*10**18
    assert hay_token_exchange.invariant() == 10*10**18*5*10**18
    assert hay_token_exchange.ethPool() == 5*10**18
    assert hay_token_exchange.tokenPool() == 10*10**18
    assert HAY_token.balanceOf(hay_token_exchange) == 10*10**18
    assert hay_token_exchange.totalShares() == 1000


def test_liquidity_investment_divestment(HAY_token, hay_token_exchange):
    # 在添加流动性时，ETH/TOKEN比值保持恒定时，无论何时添加的流动性是等价的
    # 首先往2，3号账户分别mint一些币，0，1号账户在fixture里面已经mint过500个币

    # TIPS：在brownie中，如果Contract.function()不指定from参数，会默认从生成该合约的账户发出
    # 为了更加清晰，显式给定from: accounts[0]
    HAY_token.mint(accounts[2], 2 * 10**18, {"from": accounts[0]})
    HAY_token.mint(accounts[3], 10 * 10**18, {"from": accounts[0]})

    # step 2: Approval some amount of token to token_exchange address
    HAY_token.approve(hay_token_exchange, 100 * 10**18 , {"from": accounts[0]})
    HAY_token.approve(hay_token_exchange, 30 * 10**18 , {"from": accounts[1]})
    HAY_token.approve(hay_token_exchange,  2 * 10**18 , {"from": accounts[2]})
    HAY_token.approve(hay_token_exchange, 10 * 10**18 , {"from": accounts[3]})

    # step 3: 首次注入流动性，使用5个ETH和10个TOKEN，得到1000份额
    hay_token_exchange.initializeExchange(10 * 10**18, {"from": accounts[0], "amount": 5 * 10**18})

    # step 4: 添加流动性，token需要的数量是由发送的eth的数量来计算出来的，比例按照当前池子的比例来计算
    # 注入15个ETH，应该能得到3000的份额，总共4000的份额
    hay_token_exchange.investLiquidity(1, {"from": accounts[1], "amount": 15 * 10**18})

    assert hay_token_exchange.invariant() == 40 * 10**18 * 20 * 10**18
    assert hay_token_exchange.ethPool() == 20 * 10**18
    assert hay_token_exchange.tokenPool() == 40 * 10**18
    assert hay_token_exchange.totalShares() == 4000
    assert hay_token_exchange.getShares(accounts[1]) == 3000

    # reverts context里面只能有一个函数。。。
    with brownie.reverts():
        # not enough TOKENS
        hay_token_exchange.investLiquidity(1, {"from": accounts[3], "amount": 20 * 10**18})

    with brownie.reverts():
        # no ETH
        hay_token_exchange.investLiquidity(1, {"from": accounts[3]})

    # 释放流动性
    # 取出来, 按照份额来取，输入需要释放的份额即可取出相应的TOKEN
    # Second liquidity provider divests 1000 out of his 3000 shares
    hay_token_exchange.divestLiquidity(1000, 1, 1, {"from": accounts[1]})
    assert hay_token_exchange.invariant() == 30*10**18*15*10**18
    assert hay_token_exchange.ethPool() == 15*10**18
    assert hay_token_exchange.tokenPool() == 30*10**18
    assert hay_token_exchange.getShares(accounts[0]) == 1000
    assert hay_token_exchange.getShares(accounts[1]) == 2000
    assert hay_token_exchange.totalShares() == 3000

    # First provider divests all 1000 of his shares
    hay_token_exchange.divestLiquidity(1000, 1, 1, {"from": accounts[0]})
    assert hay_token_exchange.invariant() == 20*10**18*10*10**18
    assert hay_token_exchange.ethPool() == 10*10**18
    assert hay_token_exchange.tokenPool() == 20*10**18
    assert hay_token_exchange.getShares(accounts[0]) == 0
    assert hay_token_exchange.getShares(accounts[1]) == 2000
    assert hay_token_exchange.totalShares() == 2000

    hay_token_exchange.divestLiquidity(2000, 1, 1, {"from": accounts[1]})
