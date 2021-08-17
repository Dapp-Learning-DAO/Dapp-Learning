from brownie import AlphaStrategy


def main():
    source = AlphaStrategy.get_verification_info()["flattened_source"]

    with open("flat.sol", "w") as f:
        f.write(source)
