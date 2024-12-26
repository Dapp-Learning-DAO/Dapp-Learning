from brownie.test import given, strategy
from math import sqrt


EPS = 1e-9


@given(
    lower=strategy("uint256", min_value=1, max_value=999),
    upper=strategy("uint256", min_value=1001, max_value=10000),
    shares=strategy("uint256", min_value=1, max_value=1000),
    px1=strategy("uint256", min_value=1, max_value=10000),
    px2=strategy("uint256", min_value=1, max_value=10000),
    px3=strategy("uint256", min_value=1, max_value=10000),
)
def test_manipulation(lower, upper, shares, px1, px2, px3):
    sim = Simulation(1000, lower, upper, 100)
    sim.manipulate(px1)
    sim.deposit(shares)
    sim.manipulate(px2)
    sim.withdraw(shares)
    sim.manipulate(px3)
    assert sim.balance() < EPS


@given(
    lower=strategy("uint256", min_value=1, max_value=999),
    upper=strategy("uint256", min_value=1001, max_value=10000),
    shares=strategy("uint256", min_value=1, max_value=1000),
    rebalance_lower=strategy("uint256", min_value=1, max_value=2000),
    rebalance_width=strategy("uint256", min_value=1, max_value=2000),
)
def test_arb_rebalance(lower, upper, shares, rebalance_lower, rebalance_width):
    sim = Simulation(1000, lower, upper, 100)
    sim.deposit(shares)
    sim.rebalance(rebalance_lower, rebalance_lower + rebalance_width)
    sim.withdraw(shares)
    assert sim.balance() < EPS


def calc_amount0(px, lower, upper):
    return max(0, sqrt(min(upper, px)) - sqrt(lower))


def calc_amount1(px, lower, upper):
    return max(0, 1.0 / sqrt(max(lower, px)) - 1.0 / sqrt(upper))


class Simulation(object):
    def __init__(self, px, lower, upper, total_supply):
        self.initial_px = self.px = px
        self.lower = lower
        self.upper = upper
        self.total_supply = total_supply

        self.liquidity = total_supply
        self.pool0 = self.liquidity * calc_amount0(px, lower, upper)
        self.pool1 = self.liquidity * calc_amount1(px, lower, upper)
        self.unused0 = self.unused1 = 0

        self.balance0 = self.balance1 = self.shares = 0

    def deposit(self, shares):
        # calc amounts
        amount0 = self.total0() * shares / self.total_supply
        amount1 = self.total1() * shares / self.total_supply

        # transfer
        self.balance0 -= amount0
        self.balance1 -= amount1
        self.unused0 += amount0
        self.unused1 += amount1

        # mint
        self.total_supply += shares
        self.shares += shares

    def withdraw(self, shares):
        frac = shares / self.total_supply
        assert frac > -EPS

        # transfer
        self.balance0 += self.total0() * frac
        self.balance1 += self.total1() * frac
        self.unused0 *= 1.0 - frac
        self.unused1 *= 1.0 - frac
        self.liquidity *= 1.0 - frac

        # burn
        self.total_supply -= shares
        self.shares -= shares
        assert self.shares > -EPS

    def rebalance(self, lower, upper):
        # burn
        self.unused0 += self.liquidity * calc_amount0(self.px, self.lower, self.upper)
        self.unused1 += self.liquidity * calc_amount1(self.px, self.lower, self.upper)

        # update range
        self.lower = lower
        self.upper = upper

        # calculate new liquidity
        per_share0 = calc_amount0(self.px, self.lower, self.upper)
        per_share1 = calc_amount1(self.px, self.lower, self.upper)

        # mint
        self.liquidity = min(
            self.unused0 / max(EPS, per_share0), self.unused1 / max(EPS, per_share1)
        )
        self.unused0 -= self.liquidity * calc_amount0(self.px, self.lower, self.upper)
        self.unused1 -= self.liquidity * calc_amount1(self.px, self.lower, self.upper)

    def manipulate(self, px):
        self.balance0 += self.liquidity * calc_amount0(self.px, self.lower, self.upper)
        self.balance1 += self.liquidity * calc_amount1(self.px, self.lower, self.upper)
        self.px = px

        self.balance0 -= self.liquidity * calc_amount0(self.px, self.lower, self.upper)
        self.balance1 -= self.liquidity * calc_amount1(self.px, self.lower, self.upper)

    def balance(self):
        return self.balance0 + self.initial_px * self.balance1

    def total0(self):
        return self.unused0 + self.liquidity * calc_amount0(
            self.px, self.lower, self.upper
        )

    def total1(self):
        return self.unused1 + self.liquidity * calc_amount1(
            self.px, self.lower, self.upper
        )
