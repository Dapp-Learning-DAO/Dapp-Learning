from brownie import accounts, AlphaVault, PassiveStrategy
from brownie.network.gas.strategies import GasNowScalingStrategy


# POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"  # USDC / ETH / 0.3%
# POOL = "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"  # ETH / USDT / 0.3%
POOL = "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35"  # WBTC / USDC / 0.3%

PROTOCOL_FEE = 5000  # 5%
MAX_TOTAL_SUPPLY = 2e17

BASE_THRESHOLD = 3600
LIMIT_THRESHOLD = 1200
PERIOD = 41400  # ~12 hours
MIN_TICK_MOVE = 0
MAX_TWAP_DEVIATION = 100  # 1%
TWAP_DURATION = 60  # 60 seconds
KEEPER = "0x04c82c5791bbbdfbdda3e836ccbef567fdb2ea07"


def main():
    deployer = accounts.load("deployer")
    balance = deployer.balance()

    gas_strategy = GasNowScalingStrategy()

    vault = deployer.deploy(
        AlphaVault,
        POOL,
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
        KEEPER,
        publish_source=True,
        gas_price=gas_strategy,
    )
    vault.setStrategy(strategy, {"from": deployer, "gas_price": gas_strategy})

    print(f"Gas used: {(balance - deployer.balance()) / 1e18:.4f} ETH")
    print(f"Vault address: {vault.address}")
