from brownie import accounts, UniswapExchange, Contract

def test_factory(HAY_token, BEE_token, uniswap_factory):
    assert uniswap_factory.getExchangeCount() == 0

    # brownie中Contract调用transact方法时返回的是receipt，需要使用return_value来获取值
    transaction_receipt = uniswap_factory.launchExchange(HAY_token)
    transaction_receipt2 = uniswap_factory.launchExchange(BEE_token)
    launched_exchange_address = transaction_receipt.return_value

    # print(launched_exchange_address)
    assert uniswap_factory.getExchangeCount() == 2

    hay_token_exchange = uniswap_factory.tokenToExchangeLookup(HAY_token)
    assert launched_exchange_address == uniswap_factory.tokenToExchangeLookup(HAY_token)
    assert uniswap_factory.exchangeToTokenLookup(hay_token_exchange) == HAY_token

    # 生成token_exchange的合约对象，该合约是在uniswap_factory的方法调用中生成的，
    # 不属于brownie管理的范围，要想调用它需要abi
    HTExchange = Contract.from_abi("", hay_token_exchange, UniswapExchange.abi)

    # test HAY_token initial state
    assert HTExchange.FEE_RATE() == 500
    assert HTExchange.ethPool() == 0
    assert HTExchange.tokenPool() == 0
    assert HTExchange.invariant() == 0
    assert HTExchange.totalShares() == 0
    assert HTExchange.tokenAddress() == HAY_token
    assert HTExchange.factoryAddress() == uniswap_factory