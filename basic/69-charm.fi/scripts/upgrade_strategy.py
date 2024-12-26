from brownie import (
    accounts,
    project,
    AlphaVault,
    PassiveStrategy,
)
from brownie.network.gas.strategies import GasNowScalingStrategy


VAULT_ADDRESS = "0x9bf7b46c7ad5ab62034e9349ab912c0345164322"

BASE_THRESHOLD = 3600
LIMIT_THRESHOLD = 1200
PERIOD = 41400  # ~12 hours
MIN_TICK_MOVE = 0
MAX_TWAP_DEVIATION = 100  # 1%
TWAP_DURATION = 60  # 60 seconds
KEEPER = "0x04c82c5791bbbdfbdda3e836ccbef567fdb2ea07"


def main():
    deployer = accounts.load("deployer")
    UniswapV3Core = project.load("Uniswap/uniswap-v3-core@1.0.0")

    gas_strategy = GasNowScalingStrategy()

    vault = AlphaVault.at(VAULT_ADDRESS)
    old = PassiveStrategy.at(vault.strategy())
    print(f"Old strategy address: {old.address}")

    strategy = deployer.deploy(
        PassiveStrategy,
        vault,
        BASE_THRESHOLD,
        LIMIT_THRESHOLD,
        PERIOD,
        MIN_TICK_MOVE,
        MAX_TWAP_DEVIATION,
        TWAP_DURATION,
        KEEPER,
        publish_source=True,
        gas_price=gas_strategy,
    )
    print(f"Strategy address: {strategy.address}")

    assert old.vault() == strategy.vault() == VAULT_ADDRESS
    assert old.baseThreshold() == strategy.baseThreshold() == BASE_THRESHOLD
    assert old.limitThreshold() == strategy.limitThreshold() == LIMIT_THRESHOLD
    assert old.period() == strategy.period() == PERIOD
    assert old.minTickMove() == strategy.minTickMove() == MIN_TICK_MOVE
    assert old.maxTwapDeviation() == strategy.maxTwapDeviation() == MAX_TWAP_DEVIATION
    assert old.twapDuration() == strategy.twapDuration() == TWAP_DURATION
    assert old.keeper() == strategy.keeper() == KEEPER

    vault.setStrategy(strategy, {"from": deployer, "gas_price": gas_strategy})
