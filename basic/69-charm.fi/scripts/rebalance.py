from brownie import accounts, PassiveStrategy
from brownie.network.gas.strategies import GasNowScalingStrategy
import os


STRATEGIES = [
    # "0x40C36799490042b31Efc4D3A7F8BDe5D3cB03526",  # V0 ETH/USDT
    # "0xA6803E6164EE978d8C511AfB23BA49AE0ae0C1C3",  # old V1 ETH/USDC
    # "0x5503bB32a0E37A1F0B8F8FE2006abC33C779a6FD",  # old V1 ETH/USDT

    "0x1cEA471aab8c57118d187315f3d6Ae1834cCD836",  # V1 ETH/USDC
    "0x4e03028626aa5e5d5e4CFeF2970231b0D6c5d5Ed",  # V1 ETH/USDT
    "0x8209df5A847C321d26eCb155CA76f95224c5DCd9",  # V1 WBTC/USDC
]


def getAccount(account, pw):
    from web3.auto import w3

    with open(account, "r") as f:
        return accounts.add(w3.eth.account.decrypt(f.read(), pw))


def main():
    keeper = getAccount(os.environ["KEEPER_ACCOUNT"], os.environ["KEEPER_PW"])
    # keeper = accounts.load(input("Brownie account: "))
    balance = keeper.balance()

    gas_strategy = GasNowScalingStrategy()

    for address in STRATEGIES:
        print(f"Running for strategy: {address}")
        strategy = PassiveStrategy.at(address)
        try:
            strategy.rebalance({"from": keeper, "gas_price": gas_strategy})
            print("Rebalanced!")
        except ValueError as e:
            print(e)
        print()

    print(f"Gas used: {(balance - keeper.balance()) / 1e18:.4f} ETH")
    print(f"New balance: {keeper.balance() / 1e18:.4f} ETH")
