import json
from web3 import Web3


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('../build/contracts/MyTokenMintable.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    my_contract = w3.eth.contract(abi=erc20_json_dict['abi'], bytecode=erc20_json_dict['bytecode'])
    tx_hash = my_contract.constructor(100 * 10 ** 18).transact({'from': w3.eth.accounts[0]})

    # 0. 使用my_contract类直接构建一个contract
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract = my_contract(address=tx_receipt['contractAddress'])

    # 1. 测试admin账号的权限
    # 根据MyTokenMintable的初始函数可以看到admin是合约的创建者，我们来测试一下它是否具有默认的mint权限
    print('1. ---- mint')
    # _ = contract.functions._mint(w3.eth.accounts[3], 444 * 10**decimal).transact()

if __name__ =='__main__':
    main()