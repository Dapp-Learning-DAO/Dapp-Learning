import pytest
from pytest import approx


@pytest.mark.parametrize(
    "amount0Desired,amount1Desired",
    [[1e18, 1e4], [1e4, 1e18], [1e18, 1e18]],
)
def test_total_amounts_includes_fees(
    vaultAfterPriceMove,
    pool,
    router,
    tokens,
    getPositions,
    gov,
    user,
    recipient,
    amount0Desired,
    amount1Desired,
):
    vault = vaultAfterPriceMove

    # First deposit
    tx = vault.deposit(amount0Desired, amount1Desired, 0, 0, user, {"from": user})
    shares, _, _ = tx.return_value

    total0, total1 = vault.getTotalAmounts()

    # Generate fees
    router.swap(pool, True, 1e16, {"from": gov})
    router.swap(pool, False, -1e16 * 0.997, {"from": gov})

    total0After, total1After = vault.getTotalAmounts()
    assert approx(total0After) == total0
    assert approx(total1After) == total1
    assert total0After < total0 or total1After < total1
    assert total0After > total0 or total1After > total1

    # Poke pool
    vault.deposit(10, 10, 0, 0, user, {"from": user})
    total0After, total1After = vault.getTotalAmounts()
    assert approx(total0After, rel=1e-2) == total0
    assert approx(total1After, rel=1e-2) == total1

    # Check total amounts grew due to fees
    assert total0After > total0
    assert total1After > total1


def test_total_amounts_before_rebalance(vault, user):
    total0, total1 = vault.getTotalAmounts()
    assert total0 == total1 == 0

    vault.deposit(1e8, 1e10, 0, 0, user, {"from": user})
    total0, total1 = vault.getTotalAmounts()
    assert total0 == 1e8
    assert total1 == 1e10
