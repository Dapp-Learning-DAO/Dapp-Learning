from brownie import accounts, project
import time


POOL = "0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf"  # USDC / USDT / 0.05%
POOL = "0x6c6bc977e13df9b0de53b251522280bb72383700"  # DAI / USDC / 0.05%
# POOL = "0x6f48eca74b38d2936b02ab603ff4e36a6c0e3a77"  # DAI / USDT / 0.05%

SECONDS_AGO = 60


def main():
    UniswapV3Core = project.load("Uniswap/uniswap-v3-core@1.0.0")
    pool = UniswapV3Core.interface.IUniswapV3Pool(POOL)

    while True:
        (before, after), _ = pool.observe([SECONDS_AGO, 0])
        twap = (after - before) / SECONDS_AGO
        last = pool.slot0()[1]

        print(f"twap\t{twap}\t{1.0001**twap}")
        print(f"last\t{last}\t{1.0001**last}")
        print(f"trend\t{last-twap}")
        print()

        time.sleep(max(SECONDS_AGO, 60))
