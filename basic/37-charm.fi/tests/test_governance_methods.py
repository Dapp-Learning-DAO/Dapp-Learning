from brownie import reverts
from pytest import approx


def test_vault_governance_methods(
    MockToken, vault, strategy, tokens, gov, user, recipient, keeper
):

    # Check sweep
    with reverts("token"):
        vault.sweep(tokens[0], 1e18, recipient, {"from": gov})
    with reverts("token"):
        vault.sweep(tokens[1], 1e18, recipient, {"from": gov})
    randomToken = gov.deploy(MockToken, "a", "a", 18)
    randomToken.mint(vault, 3e18, {"from": gov})
    with reverts("governance"):
        vault.sweep(randomToken, 1e18, recipient, {"from": user})
    balance = randomToken.balanceOf(recipient)
    vault.sweep(randomToken, 1e18, recipient, {"from": gov})
    assert randomToken.balanceOf(recipient) == balance + 1e18
    assert randomToken.balanceOf(vault) == 2e18

    # Check setting protocol fee
    with reverts("governance"):
        vault.setProtocolFee(0, {"from": user})
    with reverts("protocolFee"):
        vault.setProtocolFee(1e6, {"from": gov})
    vault.setProtocolFee(0, {"from": gov})
    assert vault.protocolFee() == 0

    # Check setting max total supply
    with reverts("governance"):
        vault.setMaxTotalSupply(1 << 255, {"from": user})
    vault.setMaxTotalSupply(1 << 255, {"from": gov})
    assert vault.maxTotalSupply() == 1 << 255

    # Check emergency burn
    vault.deposit(1e8, 1e10, 0, 0, gov, {"from": gov})
    strategy.rebalance({"from": keeper})

    with reverts("governance"):
        vault.emergencyBurn(vault.baseLower(), vault.baseUpper(), 1e4, {"from": user})
    balance0 = tokens[0].balanceOf(vault)
    balance1 = tokens[1].balanceOf(vault)
    total0, total1 = vault.getTotalAmounts()
    vault.emergencyBurn(vault.baseLower(), vault.baseUpper(), 1e4, {"from": gov})
    assert tokens[0].balanceOf(vault) > balance0
    assert tokens[1].balanceOf(vault) > balance1
    total0After, total1After = vault.getTotalAmounts()
    assert approx(total0After) == total0
    assert approx(total1After) == total1

    # Check setting strategy
    with reverts("governance"):
        vault.setStrategy(recipient, {"from": user})
    assert vault.strategy() != recipient
    vault.setStrategy(recipient, {"from": gov})
    assert vault.strategy() == recipient

    # Check setting governance
    with reverts("governance"):
        vault.setGovernance(recipient, {"from": user})
    assert vault.pendingGovernance() != recipient
    vault.setGovernance(recipient, {"from": gov})
    assert vault.pendingGovernance() == recipient

    # Check accepting governance
    with reverts("pendingGovernance"):
        vault.acceptGovernance({"from": user})
    assert vault.governance() != recipient
    vault.acceptGovernance({"from": recipient})
    assert vault.governance() == recipient


def test_collect_protocol_fees(
    vault, pool, strategy, router, tokens, gov, user, recipient, keeper
):
    strategy.setMaxTwapDeviation(1 << 20, {"from": gov})
    vault.deposit(1e18, 1e20, 0, 0, gov, {"from": gov})
    tx = strategy.rebalance({"from": keeper})

    router.swap(pool, True, 1e16, {"from": gov})
    router.swap(pool, False, 1e18, {"from": gov})
    tx = strategy.rebalance({"from": keeper})
    protocolFees0, protocolFees1 = (
        vault.accruedProtocolFees0(),
        vault.accruedProtocolFees1(),
    )

    balance0 = tokens[0].balanceOf(recipient)
    balance1 = tokens[1].balanceOf(recipient)
    with reverts("governance"):
        vault.collectProtocol(1e3, 1e4, recipient, {"from": user})
    with reverts("SafeMath: subtraction overflow"):
        vault.collectProtocol(1e18, 1e4, recipient, {"from": gov})
    with reverts("SafeMath: subtraction overflow"):
        vault.collectProtocol(1e3, 1e18, recipient, {"from": gov})
    vault.collectProtocol(1e3, 1e4, recipient, {"from": gov})
    assert vault.accruedProtocolFees0() == protocolFees0 - 1e3
    assert vault.accruedProtocolFees1() == protocolFees1 - 1e4
    assert tokens[0].balanceOf(recipient) - balance0 == 1e3
    assert tokens[1].balanceOf(recipient) - balance1 == 1e4 > 0


def test_strategy_governance_methods(vault, strategy, gov, user, recipient):

    # Check setting base threshold
    with reverts("governance"):
        strategy.setBaseThreshold(0, {"from": user})
    with reverts("threshold % tickSpacing"):
        strategy.setBaseThreshold(2401, {"from": gov})
    with reverts("threshold > 0"):
        strategy.setBaseThreshold(0, {"from": gov})
    with reverts("threshold too high"):
        strategy.setBaseThreshold(887280, {"from": gov})
    strategy.setBaseThreshold(4800, {"from": gov})
    assert strategy.baseThreshold() == 4800

    # Check setting limit threshold
    with reverts("governance"):
        strategy.setLimitThreshold(0, {"from": user})
    with reverts("threshold % tickSpacing"):
        strategy.setLimitThreshold(1201, {"from": gov})
    with reverts("threshold > 0"):
        strategy.setLimitThreshold(0, {"from": gov})
    with reverts("threshold too high"):
        strategy.setLimitThreshold(887280, {"from": gov})
    strategy.setLimitThreshold(600, {"from": gov})
    assert strategy.limitThreshold() == 600

    # Check setting max twap deviation
    with reverts("governance"):
        strategy.setMaxTwapDeviation(1000, {"from": user})
    with reverts("maxTwapDeviation"):
        strategy.setMaxTwapDeviation(-1, {"from": gov})
    strategy.setMaxTwapDeviation(1000, {"from": gov})
    assert strategy.maxTwapDeviation() == 1000

    # Check setting twap duration
    with reverts("governance"):
        strategy.setTwapDuration(800, {"from": user})
    strategy.setTwapDuration(800, {"from": gov})
    assert strategy.twapDuration() == 800

    # Check setting keeper
    with reverts("governance"):
        strategy.setKeeper(recipient, {"from": user})
    assert strategy.keeper() != recipient
    strategy.setKeeper(recipient, {"from": gov})
    assert strategy.keeper() == recipient

    # Check gov changed in vault
    vault.setGovernance(user, {"from": gov})
    vault.acceptGovernance({"from": user})
    with reverts("governance"):
        strategy.setKeeper(recipient, {"from": gov})
    strategy.setKeeper(recipient, {"from": user})
