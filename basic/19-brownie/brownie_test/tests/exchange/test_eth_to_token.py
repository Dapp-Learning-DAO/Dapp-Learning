from brownie import (accounts, web3)


def test_eth_to_token_swap(HAY_token, hay_token_exchange):
    HAY_token.approve(hay_token_exchange, 10 * 10**18, {"from": accounts[0]})

    # step 1: initialize exchange
    hay_token_exchange.initializeExchange(10 * 10**18, {"from": accounts[0], "amount": 5 * 10**18})

    # the swap function needs a timeout parameter
    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300
    assert HAY_token.balanceOf(accounts[2]) == 0

    hay_token_exchange.ethToTokenSwap(1, timeout, {"from": accounts[2], "amount": 1 * 10**18})
    # step 2: calculate the entries in transforming ETH to Token
    # a) 注入ETH，直接先收取0.2%的手续费，最后注入到pool中，以input token的形式收取，这里是ETH，上例中收取0.002 ether
    #      fee = 0.2% * 1 * 10**18 = 2000000000000000
    # b) 计算池子中剩余的token数量: Token pool = (last invariant) / ( ETH pool - fee )
    #     注意在计算时，分子分母都要取整数，int(a) // int(b)
    #           e.g.    Token pool = 10 * 10**18 * 5 * 10**18 / (5.998 * 10**18) = 8336112037345781927
    # c) 计算返回的token的数量: Token received = original Token amount - Token pool
    #                                       = 10 * 10**18 - 8336112037345781927
    #                                       = 1663887962654218073
    # d) 更新ETH-TOKEN池子的所有状态量：
    #   invariant = Token pool * ETH pool = 8336112037345781927 * 6 * 10**18 = 50016672224074691562000000000000000000
    #   Token Pool = 8336112037345781927
    #   ETH pool = 6 * 10**18
    assert hay_token_exchange.ethPool() == 6 * 10**18
    assert web3.eth.getBalance(hay_token_exchange.address) == 6 * 10**18
    assert hay_token_exchange.tokenPool() == 8336112037345781927
    assert HAY_token.balanceOf(hay_token_exchange) == 8336112037345781927
    assert hay_token_exchange.invariant() == 50016672224074691562000000000000000000
    assert HAY_token.balanceOf(accounts[2]) == 1663887962654218073


def test_fallback_eth_to_token_swap(HAY_token, hay_token_exchange):
    # 测试uniswap exchange合约的默认fallback函数，即直接往这个地址转入eth，则默认是用ETH换取TOKEN的操作
    HAY_token.approve(hay_token_exchange, 10 * 10**18, {"from": accounts[0]})

    # step 1: initialize exchange
    hay_token_exchange.initializeExchange(10 * 10**18, {"from": accounts[0], "amount": 5 * 10**18})
    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300

    # step 2: use accounts[2] to do the test
    assert HAY_token.balanceOf(accounts[2]) == 0
    accounts[2].transfer(hay_token_exchange, 1 * 10**18)

    assert hay_token_exchange.ethPool() == 6 * 10 ** 18
    assert web3.eth.getBalance(hay_token_exchange.address) == 6 * 10 ** 18
    assert hay_token_exchange.tokenPool() == 8336112037345781927
    assert HAY_token.balanceOf(hay_token_exchange) == 8336112037345781927
    assert hay_token_exchange.invariant() == 50016672224074691562000000000000000000
    assert HAY_token.balanceOf(accounts[2]) == 1663887962654218073


def test_eth_to_token_payment(HAY_token, hay_token_exchange):
    # 测试eth2token payment函数，与swap函数不同的点是receipt是另一个地址
    # 用accounts[2]的ETH取exchange中交易，交易所得TOken发往accounts[3]
    HAY_token.approve(hay_token_exchange, 10 * 10 ** 18, {"from": accounts[0]})

    # step 1: initialize exchange
    hay_token_exchange.initializeExchange(10 * 10 ** 18, {"from": accounts[0], "amount": 5 * 10 ** 18})
    timeout = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 300

    # 开始的两个地址的TOken数量都为0
    assert HAY_token.balanceOf(accounts[2]) == 0
    assert HAY_token.balanceOf(accounts[3]) == 0

    hay_token_exchange.ethToTokenPayment(1, timeout, accounts[3], {"from": accounts[2], "amount": 1 * 10**18})

    assert hay_token_exchange.ethPool() == 6 * 10 ** 18
    assert web3.eth.getBalance(hay_token_exchange.address) == 6 * 10 ** 18
    assert hay_token_exchange.tokenPool() == 8336112037345781927
    assert HAY_token.balanceOf(hay_token_exchange) == 8336112037345781927
    assert hay_token_exchange.invariant() == 50016672224074691562000000000000000000
    assert HAY_token.balanceOf(accounts[3]) == 1663887962654218073
    assert HAY_token.balanceOf(accounts[2]) == 0
