from brownie import chain, reverts
import pytest
from pytest import approx

from conftest import computePositionKey


@pytest.mark.parametrize("buy", [False, True])
@pytest.mark.parametrize("big", [False, True])
def test_strategy_rebalance(
    vault, strategy, pool, tokens, router, getPositions, gov, user, keeper, buy, big
):
    # Mint some liquidity
    vault.deposit(1e16, 1e18, 0, 0, user, {"from": user})
    strategy.rebalance({"from": keeper})

    # Do a swap to move the price
    qty = 1e16 * [100, 1][buy] * [1, 100][big]
    router.swap(pool, buy, qty, {"from": gov})
    baseLower, baseUpper = vault.baseLower(), vault.baseUpper()
    limitLower, limitUpper = vault.limitLower(), vault.limitUpper()

    # fast forward 1 hour
    chain.sleep(3600)

    # Store totals
    total0, total1 = vault.getTotalAmounts()
    totalSupply = vault.totalSupply()

    # Rebalance
    tx = strategy.rebalance({"from": keeper})

    # Check old positions are empty
    liquidity, _, _, owed0, owed1 = pool.positions(
        computePositionKey(vault, baseLower, baseUpper)
    )
    assert liquidity == owed0 == owed1 == 0
    liquidity, _, _, owed0, owed1 = pool.positions(
        computePositionKey(vault, limitLower, limitUpper)
    )
    assert liquidity == owed0 == owed1 == 0

    # Check ranges are set correctly
    tick = pool.slot0()[1]
    tickFloor = tick // 60 * 60
    assert vault.baseLower() == tickFloor - 2400
    assert vault.baseUpper() == tickFloor + 60 + 2400
    if buy:
        assert vault.limitLower() == tickFloor + 60
        assert vault.limitUpper() == tickFloor + 60 + 1200
    else:
        assert vault.limitLower() == tickFloor - 1200
        assert vault.limitUpper() == tickFloor

    assert strategy.lastRebalance() == tx.timestamp
    assert strategy.lastTick() == tick
    assert strategy.getTick() == tick

    base, limit = getPositions(vault)

    if big:
        # If order is too big, all tokens go to limit order
        assert base[0] == 0
        assert limit[0] > 0
    else:
        assert base[0] > 0
        assert limit[0] > 0

    # Check no tokens left unused. Only small amount left due to rounding
    assert tokens[0].balanceOf(vault) - vault.accruedProtocolFees0() < 1000
    assert tokens[1].balanceOf(vault) - vault.accruedProtocolFees1() < 1000

    # Check event
    total0After, total1After = vault.getTotalAmounts()
    (ev,) = tx.events["Snapshot"]
    assert ev["tick"] == tick
    assert approx(ev["totalAmount0"]) == total0After
    assert approx(ev["totalAmount1"]) == total1After
    assert ev["totalSupply"] == vault.totalSupply()

    (ev1, ev2) = tx.events["CollectFees"]
    dtotal0 = total0After - total0 + ev1["feesToProtocol0"] + ev2["feesToProtocol0"]
    dtotal1 = total1After - total1 + ev1["feesToProtocol1"] + ev2["feesToProtocol1"]
    assert (
        approx(ev1["feesToVault0"] + ev2["feesToVault0"], rel=1e-6, abs=1)
        == dtotal0 * 0.99
    )
    assert (
        approx(ev1["feesToProtocol0"] + ev2["feesToProtocol0"], rel=1e-6, abs=1)
        == dtotal0 * 0.01
    )
    assert (
        approx(ev1["feesToVault1"] + ev2["feesToVault1"], rel=1e-6, abs=1)
        == dtotal1 * 0.99
    )
    assert (
        approx(ev1["feesToProtocol1"] + ev2["feesToProtocol1"], rel=1e-6, abs=1)
        == dtotal1 * 0.01
    )


@pytest.mark.parametrize("buy", [False, True])
def test_rebalance_twap_check(
    vault, strategy, pool, tokens, router, gov, user, keeper, buy
):

    # Reduce max deviation
    strategy.setMaxTwapDeviation(500, {"from": gov})

    # Mint some liquidity
    vault.deposit(1e8, 1e10, 0, 0, user, {"from": user})

    # Do a swap to move the price a lot
    qty = 1e16 * 100 * [100, 1][buy]
    router.swap(pool, buy, qty, {"from": gov})

    # Can't rebalance
    with reverts("maxTwapDeviation"):
        strategy.rebalance({"from": keeper})

    # Wait for twap period to pass and poke price
    chain.sleep(610)
    router.swap(pool, buy, 1e8, {"from": gov})

    # Rebalance
    strategy.rebalance({"from": keeper})


def test_can_rebalance_when_vault_empty(
    vault, strategy, pool, tokens, gov, user, keeper
):
    assert tokens[0].balanceOf(vault) == 0
    assert tokens[1].balanceOf(vault) == 0
    strategy.rebalance({"from": keeper})
    tx = strategy.rebalance({"from": keeper})

    # Check ranges are set correctly
    tick = pool.slot0()[1]
    tickFloor = tick // 60 * 60
    assert vault.baseLower() == tickFloor - 2400
    assert vault.baseUpper() == tickFloor + 60 + 2400
    assert vault.limitLower() == tickFloor + 60
    assert vault.limitUpper() == tickFloor + 60 + 1200

    assert strategy.lastRebalance() == tx.timestamp
    assert strategy.lastTick() == tick


@pytest.mark.parametrize("bid", [False, True])
def test_rebalance(
    vault, strategy, pool, tokens, router, getPositions, gov, user, keeper, bid
):
    # Mint some liquidity
    vault.deposit(1e16, 1e18, 0, 0, user, {"from": user})

    # Store old state
    baseLower, baseUpper = vault.baseLower(), vault.baseUpper()
    limitLower, limitUpper = vault.limitLower(), vault.limitUpper()
    total0, total1 = vault.getTotalAmounts()
    totalSupply = vault.totalSupply()
    tick = pool.slot0()[1]
    assert 42000 < tick < 48000

    # Rebalance
    if bid:
        tx = vault.rebalance(
            0, 0, 42000, 54000, -120000, -60000, 60000, 120000, {"from": strategy}
        )
    else:
        tx = vault.rebalance(
            0, 0, 36000, 48000, -120000, -60000, 60000, 120000, {"from": strategy}
        )

    # Check old positions are empty
    liquidity, _, _, owed0, owed1 = pool.positions(
        computePositionKey(vault, baseLower, baseUpper)
    )
    assert liquidity == owed0 == owed1 == 0
    liquidity, _, _, owed0, owed1 = pool.positions(
        computePositionKey(vault, limitLower, limitUpper)
    )
    assert liquidity == owed0 == owed1 == 0

    # Check ranges are set correctly
    if bid:
        assert vault.baseLower() == 42000
        assert vault.baseUpper() == 54000
        assert vault.limitLower() == -120000
        assert vault.limitUpper() == -60000
    else:
        assert vault.baseLower() == 36000
        assert vault.baseUpper() == 48000
        assert vault.limitLower() == 60000
        assert vault.limitUpper() == 120000

    base, limit = getPositions(vault)
    assert base[0] > 0
    assert limit[0] > 0

    # Check no tokens left unused. Only small amount left due to rounding
    assert tokens[0].balanceOf(vault) - vault.accruedProtocolFees0() < 1000
    assert tokens[1].balanceOf(vault) - vault.accruedProtocolFees1() < 1000

    # Check event
    total0After, total1After = vault.getTotalAmounts()
    (ev,) = tx.events["Snapshot"]
    assert ev["tick"] == tick
    assert approx(ev["totalAmount0"]) == total0After
    assert approx(ev["totalAmount1"]) == total1After
    assert ev["totalSupply"] == vault.totalSupply()

    (ev1, ev2) = tx.events["CollectFees"]
    dtotal0 = total0After - total0 + ev1["feesToProtocol0"] + ev2["feesToProtocol0"]
    dtotal1 = total1After - total1 + ev1["feesToProtocol1"] + ev2["feesToProtocol1"]
    assert (
        approx(ev1["feesToVault0"] + ev2["feesToVault0"], rel=1e-6, abs=1)
        == dtotal0 * 0.99
    )
    assert (
        approx(ev1["feesToProtocol0"] + ev2["feesToProtocol0"], rel=1e-6, abs=1)
        == dtotal0 * 0.01
    )
    assert (
        approx(ev1["feesToVault1"] + ev2["feesToVault1"], rel=1e-6, abs=1)
        == dtotal1 * 0.99
    )
    assert (
        approx(ev1["feesToProtocol1"] + ev2["feesToProtocol1"], rel=1e-6, abs=1)
        == dtotal1 * 0.01
    )


def test_rebalance_checks(vault, strategy, pool, gov, user, keeper):
    with reverts("tickLower < tickUpper"):
        vault.rebalance(0, 0, 600, 600, 0, 60, 0, 60, {"from": strategy})
    with reverts("tickLower < tickUpper"):
        vault.rebalance(0, 0, 0, 60, 600, 600, 0, 60, {"from": strategy})
    with reverts("tickLower < tickUpper"):
        vault.rebalance(0, 0, 0, 60, 0, 60, 600, 600, {"from": strategy})

    with reverts("tickLower too low"):
        vault.rebalance(0, 0, -887280, 60, 0, 60, 0, 60, {"from": strategy})
    with reverts("tickLower too low"):
        vault.rebalance(0, 0, 0, 60, -887280, 60, 0, 60, {"from": strategy})
    with reverts("tickLower too low"):
        vault.rebalance(0, 0, 0, 60, 0, 60, -887280, 60, {"from": strategy})

    with reverts("tickUpper too high"):
        vault.rebalance(0, 0, 0, 887280, 0, 60, 0, 60, {"from": strategy})
    with reverts("tickUpper too high"):
        vault.rebalance(0, 0, 0, 60, 0, 887280, 0, 60, {"from": strategy})
    with reverts("tickUpper too high"):
        vault.rebalance(0, 0, 0, 60, 0, 60, 0, 887280, {"from": strategy})

    with reverts("tickLower % tickSpacing"):
        vault.rebalance(0, 0, 1, 60, 0, 60, 0, 60, {"from": strategy})
    with reverts("tickLower % tickSpacing"):
        vault.rebalance(0, 0, 0, 60, 1, 60, 0, 60, {"from": strategy})
    with reverts("tickLower % tickSpacing"):
        vault.rebalance(0, 0, 0, 60, 0, 60, 1, 60, {"from": strategy})

    with reverts("tickUpper % tickSpacing"):
        vault.rebalance(0, 0, 0, 61, 0, 60, 0, 60, {"from": strategy})
    with reverts("tickUpper % tickSpacing"):
        vault.rebalance(0, 0, 0, 60, 0, 61, 0, 60, {"from": strategy})
    with reverts("tickUpper % tickSpacing"):
        vault.rebalance(0, 0, 0, 60, 0, 60, 0, 61, {"from": strategy})

    with reverts("bidUpper"):
        vault.rebalance(
            0, 0, -60000, 60000, -120000, 60000, 60000, 120000, {"from": strategy}
        )
    with reverts("askLower"):
        vault.rebalance(
            0, 0, -60000, 60000, -120000, -60000, -60000, 120000, {"from": strategy}
        )

    for u in [gov, user, keeper]:
        with reverts("strategy"):
            vault.rebalance(0, 0, 0, 60, 0, 60, 0, 60, {"from": u})

    vault.rebalance(
        0, 0, -60000, 60000, -120000, -60000, 60000, 120000, {"from": strategy}
    )


def test_rebalance_swap(vault, strategy, pool, user, keeper):
    min_sqrt = 4295128739
    max_sqrt = 1461446703485210103287273052203988822378723970342

    # Mint some liquidity
    vault.deposit(1e16, 1e18, 0, 0, user, {"from": user})

    total0, total1 = vault.getTotalAmounts()
    vault.rebalance(
        1e8,
        min_sqrt + 1,
        -60000,
        60000,
        -120000,
        -60000,
        60000,
        120000,
        {"from": strategy},
    )

    total0After, total1After = vault.getTotalAmounts()
    assert approx(total0 - total0After) == 1e8
    assert total1 < total1After

    price = 1.0001 ** pool.slot0()[1]
    assert approx(total0 * price + total1) == total0After * price + total1

    total0, total1 = vault.getTotalAmounts()
    vault.rebalance(
        -1e8,
        max_sqrt - 1,
        -60000,
        60000,
        -120000,
        -60000,
        60000,
        120000,
        {"from": strategy},
    )

    total0After, total1After = vault.getTotalAmounts()
    assert approx(total1 - total1After) == 1e8
    assert total0 < total0After

    price = 1.0001 ** pool.slot0()[1]
    assert approx(total0 * price + total1) == total0After * price + total1
