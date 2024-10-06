from brownie import (
    accounts,
    project,
    MockToken,
    AlphaVault,
    PassiveStrategy,
    TestRouter,
    ZERO_ADDRESS,
)
from brownie.network.gas.strategies import GasNowScalingStrategy
from math import floor, sqrt
import time


# Uniswap v3 factory on Rinkeby
FACTORY = "0xAE28628c0fdFb5e54d60FEDC6C9085199aec14dF"

PROTOCOL_FEE = 10000
MAX_TOTAL_SUPPLY = 1e32

BASE_THRESHOLD = 3600
LIMIT_THRESHOLD = 1200
PERIOD = 43200  # 12 hours
MIN_TICK_MOVE = 0
MAX_TWAP_DEVIATION = 100  # 1%
TWAP_DURATION = 60  # 60 seconds


def main():
    deployer = accounts.load("deployer")
    UniswapV3Core = project.load("Uniswap/uniswap-v3-core@1.0.0")

    gas_strategy = GasNowScalingStrategy()

    eth = deployer.deploy(MockToken, "ETH", "ETH", 18)
    usdc = deployer.deploy(MockToken, "USDC", "USDC", 6)

    eth.mint(deployer, 100 * 1e18, {"from": deployer, "gas_price": gas_strategy})
    usdc.mint(deployer, 100000 * 1e6, {"from": deployer, "gas_price": gas_strategy})

    factory = UniswapV3Core.interface.IUniswapV3Factory(FACTORY)
    factory.createPool(eth, usdc, 3000, {"from": deployer, "gas_price": gas_strategy})
    time.sleep(15)

    pool = UniswapV3Core.interface.IUniswapV3Pool(factory.getPool(eth, usdc, 3000))

    inverse = pool.token0() == usdc
    price = 1e18 / 2000e6 if inverse else 2000e6 / 1e18

    # Set ETH/USDC price to 2000
    pool.initialize(
        floor(sqrt(price) * (1 << 96)), {"from": deployer, "gas_price": gas_strategy}
    )

    # Increase cardinality so TWAP works
    pool.increaseObservationCardinalityNext(
        100, {"from": deployer, "gas_price": gas_strategy}
    )

    router = deployer.deploy(TestRouter)
    MockToken.at(eth).approve(
        router, 1 << 255, {"from": deployer, "gas_price": gas_strategy}
    )
    MockToken.at(usdc).approve(
        router, 1 << 255, {"from": deployer, "gas_price": gas_strategy}
    )
    time.sleep(15)

    max_tick = 887272 // 60 * 60
    router.mint(
        pool, -max_tick, max_tick, 1e14, {"from": deployer, "gas_price": gas_strategy}
    )

    vault = deployer.deploy(
        AlphaVault,
        pool,
        PROTOCOL_FEE,
        MAX_TOTAL_SUPPLY,
        publish_source=True,
        gas_price=gas_strategy,
    )

    strategy = deployer.deploy(
        PassiveStrategy,
        vault,
        BASE_THRESHOLD,
        LIMIT_THRESHOLD,
        PERIOD,
        MIN_TICK_MOVE,
        MAX_TWAP_DEVIATION,
        TWAP_DURATION,
        deployer,
        publish_source=True,
        gas_price=gas_strategy,
    )
    vault.setStrategy(strategy, {"from": deployer, "gas_price": gas_strategy})

    print(f"Vault address: {vault.address}")
    print(f"Strategy address: {strategy.address}")
    print(f"Router address: {router.address}")
