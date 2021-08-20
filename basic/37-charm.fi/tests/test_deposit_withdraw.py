from brownie import chain, reverts, ZERO_ADDRESS
import pytest
from pytest import approx


@pytest.mark.parametrize(
    "amount0Desired,amount1Desired",
    [[0, 1], [1, 0], [1e18, 0], [0, 1e18], [1e4, 1e18], [1e18, 1e18]],
)
def test_initial_deposit(
    vault,
    tokens,
    gov,
    user,
    recipient,
    amount0Desired,
    amount1Desired,
):

    # Store balances
    balance0 = tokens[0].balanceOf(user)
    balance1 = tokens[1].balanceOf(user)

    # Deposit
    tx = vault.deposit(amount0Desired, amount1Desired, 0, 0, recipient, {"from": user})
    shares, amount0, amount1 = tx.return_value

    # Check amounts are same as inputs
    assert amount0 == amount0Desired
    assert amount1 == amount1Desired

    # Check received right number of shares
    assert shares == vault.balanceOf(recipient) > 0

    # Check paid right amount of tokens
    assert amount0 == balance0 - tokens[0].balanceOf(user)
    assert amount1 == balance1 - tokens[1].balanceOf(user)

    # Check event
    assert tx.events["Deposit"] == {
        "sender": user,
        "to": recipient,
        "shares": shares,
        "amount0": amount0,
        "amount1": amount1,
    }


@pytest.mark.parametrize(
    "amount0Desired,amount1Desired",
    [[1, 1e18], [1e18, 1], [1e4, 1e18], [1e18, 1e18]],
)
def test_deposit(
    vaultAfterPriceMove,
    tokens,
    getPositions,
    gov,
    user,
    recipient,
    amount0Desired,
    amount1Desired,
):
    vault = vaultAfterPriceMove

    # Store balances, supply and positions
    balance0 = tokens[0].balanceOf(user)
    balance1 = tokens[1].balanceOf(user)
    totalSupply = vault.totalSupply()
    total0, total1 = vault.getTotalAmounts()
    govShares = vault.balanceOf(gov)

    # Deposit
    tx = vault.deposit(amount0Desired, amount1Desired, 0, 0, recipient, {"from": user})
    shares, amount0, amount1 = tx.return_value

    # Check amounts don't exceed desired
    assert amount0 <= amount0Desired
    assert amount1 <= amount1Desired

    # Check received right number of shares
    assert shares == vault.balanceOf(recipient) > 0

    # Check paid right amount of tokens
    assert amount0 == balance0 - tokens[0].balanceOf(user)
    assert amount1 == balance1 - tokens[1].balanceOf(user)

    # Check one amount is tight
    assert approx(amount0) == amount0Desired or approx(amount1) == amount1Desired

    # Check total amounts are in proportion
    total0After, total1After = vault.getTotalAmounts()
    totalSupplyAfter = vault.totalSupply()
    assert approx(total0 * total1After) == total1 * total0After
    assert approx(total0 * totalSupplyAfter) == total0After * totalSupply
    assert approx(total1 * totalSupplyAfter) == total1After * totalSupply

    # Check event
    assert tx.events["Deposit"] == {
        "sender": user,
        "to": recipient,
        "shares": shares,
        "amount0": amount0,
        "amount1": amount1,
    }


@pytest.mark.parametrize(
    "amount0Desired,amount1Desired",
    [[1e4, 1e18], [1e18, 1e18]],
)
def test_deposit_when_vault_only_has_token0(
    vaultOnlyWithToken0,
    pool,
    tokens,
    getPositions,
    gov,
    user,
    recipient,
    amount0Desired,
    amount1Desired,
):
    vault = vaultOnlyWithToken0

    # Poke fees
    vault.withdraw(vault.balanceOf(gov) // 2, 0, 0, gov, {"from": gov})

    # Store balances, supply and positions
    balance0 = tokens[0].balanceOf(user)
    balance1 = tokens[1].balanceOf(user)
    totalSupply = vault.totalSupply()
    total0, total1 = vault.getTotalAmounts()

    # Deposit
    tx = vault.deposit(amount0Desired, amount1Desired, 0, 0, recipient, {"from": user})
    shares, amount0, amount1 = tx.return_value

    # Check amounts don't exceed desired
    assert amount0 <= amount0Desired
    assert amount1 <= amount1Desired

    # Check received right number of shares
    assert shares == vault.balanceOf(recipient) > 0

    # Check paid right amount of tokens
    assert amount0 == balance0 - tokens[0].balanceOf(user)
    assert amount1 == balance1 - tokens[1].balanceOf(user)

    # Check paid mainly token0
    assert amount0 > 0
    assert approx(amount1 / amount0, abs=1e-3) == 0

    # Check amount is tight
    assert approx(amount0) == amount0Desired

    # Check total amounts are in proportion
    total0After, total1After = vault.getTotalAmounts()
    totalSupplyAfter = vault.totalSupply()
    assert approx(total0 * totalSupplyAfter) == total0After * totalSupply


@pytest.mark.parametrize(
    "amount0Desired,amount1Desired",
    [[1e4, 1e18], [1e18, 1e18]],
)
def test_deposit_when_vault_only_has_token1(
    vaultOnlyWithToken1,
    pool,
    tokens,
    getPositions,
    gov,
    user,
    recipient,
    amount0Desired,
    amount1Desired,
):
    vault = vaultOnlyWithToken1

    # Poke fees
    vault.withdraw(vault.balanceOf(gov) // 2, 0, 0, gov, {"from": gov})

    # Store balances, supply and positions
    balance0 = tokens[0].balanceOf(user)
    balance1 = tokens[1].balanceOf(user)
    totalSupply = vault.totalSupply()
    total0, total1 = vault.getTotalAmounts()

    # Deposit
    tx = vault.deposit(amount0Desired, amount1Desired, 0, 0, recipient, {"from": user})
    shares, amount0, amount1 = tx.return_value

    # Check amounts don't exceed desired
    assert amount0 <= amount0Desired
    assert amount1 <= amount1Desired

    # Check received right number of shares
    assert shares == vault.balanceOf(recipient) > 0

    # Check paid right amount of tokens
    assert amount0 == balance0 - tokens[0].balanceOf(user)
    assert amount1 == balance1 - tokens[1].balanceOf(user)

    # Check paid mainly token1
    assert amount1 > 0
    assert approx(amount0 / amount1, abs=1e-3) == 0

    # Check amount is tight
    assert approx(amount1) == amount1Desired

    # Check total amounts are in proportion
    total0After, total1After = vault.getTotalAmounts()
    totalSupplyAfter = vault.totalSupply()
    assert approx(total1 * totalSupplyAfter) == total1After * totalSupply


def test_deposit_checks(vault, user):
    with reverts("amount0Desired or amount1Desired"):
        vault.deposit(0, 0, 0, 0, user, {"from": user})
    with reverts("to"):
        vault.deposit(1e8, 1e8, 0, 0, ZERO_ADDRESS, {"from": user})
    with reverts("to"):
        vault.deposit(1e8, 1e8, 0, 0, vault, {"from": user})

    with reverts("amount0Min"):
        vault.deposit(1e8, 0, 2e8, 0, user, {"from": user})
    with reverts("amount1Min"):
        vault.deposit(0, 1e8, 0, 2e8, user, {"from": user})

    with reverts("maxTotalSupply"):
        vault.deposit(1e8, 200e18, 0, 0, user, {"from": user})


def test_withdraw(
    vaultAfterPriceMove,
    strategy,
    pool,
    tokens,
    getPositions,
    gov,
    user,
    recipient,
    keeper,
):
    vault = vaultAfterPriceMove

    # Deposit and rebalance
    tx = vault.deposit(1e8, 1e10, 0, 0, user, {"from": user})
    shares, _, _ = tx.return_value
    strategy.rebalance({"from": keeper})

    # Store balances, supply and positions
    balance0 = tokens[0].balanceOf(recipient)
    balance1 = tokens[1].balanceOf(recipient)
    totalSupply = vault.totalSupply()
    total0, total1 = vault.getTotalAmounts()
    basePos, limitPos = getPositions(vault)

    # Withdraw all shares
    tx = vault.withdraw(shares, 0, 0, recipient, {"from": user})
    amount0, amount1 = tx.return_value

    # Check is empty now
    assert vault.balanceOf(user) == 0

    # Check received right amount of tokens
    assert tokens[0].balanceOf(recipient) - balance0 == amount0 > 0
    assert tokens[1].balanceOf(recipient) - balance1 == amount1 > 0

    # Check total amounts are in proportion
    ratio = (totalSupply - shares) / totalSupply
    total0After, total1After = vault.getTotalAmounts()
    assert approx(total0After / total0) == ratio
    assert approx(total1After / total1) == ratio

    # Check liquidity in pool decreases proportionally
    basePosAfter, limitPosAfter = getPositions(vault)
    assert approx(basePosAfter[0] / basePos[0]) == ratio
    assert approx(limitPosAfter[0] / limitPos[0]) == ratio

    # Check event
    assert tx.events["Withdraw"] == {
        "sender": user,
        "to": recipient,
        "shares": shares,
        "amount0": amount0,
        "amount1": amount1,
    }


def test_withdraw_checks(vault, user, recipient):
    tx = vault.deposit(1e8, 1e10, 0, 0, user, {"from": user})
    shares, _, _ = tx.return_value

    with reverts("shares"):
        vault.withdraw(0, 0, 0, recipient, {"from": user})
    with reverts("to"):
        vault.withdraw(shares - 1000, 0, 0, ZERO_ADDRESS, {"from": user})
    with reverts("to"):
        vault.withdraw(shares - 1000, 0, 0, vault, {"from": user})

    with reverts("amount0Min"):
        vault.withdraw(shares - 1000, 1e18, 0, recipient, {"from": user})
    with reverts("amount1Min"):
        vault.withdraw(shares - 1000, 0, 1e18, recipient, {"from": user})
