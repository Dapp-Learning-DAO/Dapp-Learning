import json
from web3 import Web3


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('../build/contracts/ERC20.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    print(type(erc20_json_dict))
    print(erc20_json_dict['abi'])
    print(erc20_json_dict.keys())

    w3.eth.default_account = w3.eth.accounts[0]

    tx_hash = w3.eth.contract(
        abi=erc20_json_dict['abi'],
        bytecode=erc20_json_dict['bytecode']).constructor('shit', 'hh' ).transact({'from':w3.eth.accounts[1]})

    address = w3.eth.get_transaction_receipt(tx_hash)['contractAddress']
    print(address)
    print(w3.eth.coinbase)

    print(w3.eth.default_account)
    print(w3.eth.chain_id)


if __name__ =='__main__':
    main()