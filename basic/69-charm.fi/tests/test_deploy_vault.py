from brownie import reverts, ZERO_ADDRESS


def test_constructor(AlphaVault, pool, gov):
    vault = gov.deploy(AlphaVault, pool, 10000, 100e18)
    assert vault.pool() == pool
    assert vault.token0() == pool.token0()
    assert vault.token1() == pool.token1()

    assert vault.protocolFee() == 10000
    assert vault.maxTotalSupply() == 100e18
    assert vault.governance() == gov
    assert vault.strategy() == ZERO_ADDRESS

    assert vault.name() == "Alpha Vault"
    assert vault.symbol() == "AV"
    assert vault.decimals() == 18

    assert vault.getTotalAmounts() == (0, 0)


def test_constructor_checks(AlphaVault, pool, gov):
    with reverts("protocolFee"):
        gov.deploy(AlphaVault, pool, 1e6, 100e18)
