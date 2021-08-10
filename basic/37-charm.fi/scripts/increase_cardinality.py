from brownie import accounts, project
from brownie.network.gas.strategies import GasNowScalingStrategy


# POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"  # USDC / ETH
POOL = "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"  # ETH / USDT

CARDINALITY = 10


def main():
    deployer = accounts.load("deployer")
    UniswapV3Core = project.load("Uniswap/uniswap-v3-core@1.0.0")

    gas_strategy = GasNowScalingStrategy()
    balance = keeper.balance()

    pool = UniswapV3Core.interface.IUniswapV3Pool(POOL)
    pool.increaseObservationCardinalityNext(
        CARDINALITY, {"from": deployer, "gas_price": gas_strategy}
    )

    print(f"Gas used: {(balance - keeper.balance()) / 1e18:.4f} ETH")
    print(f"New balance: {keeper.balance() / 1e18:.4f} ETH")
