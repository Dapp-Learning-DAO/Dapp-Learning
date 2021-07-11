import json
from web3 import Web3


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('./build/contracts/MyToken.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    # 1. 查看ganache上的账号以及设置默认账号等
    print("Accounts Balance before send transaction :")
    for acc in w3.eth.accounts:
        print("Account " + acc + " : " + str(w3.eth.get_balance(acc)))
    w3.eth.default_account = w3.eth.accounts[0]

    # 2. 部署智能合约， 使用web3.eth.contract， 传入abi和bytecode，
    # 2.1 构建一个contract对象，它的类型是由abi和bytecode决定的
    # 生成一个Contract的工厂对象
    my_contract = w3.eth.contract(abi=erc20_json_dict['abi'], bytecode=erc20_json_dict['bytecode'])

    # 2.2 发送该合约到链上，可以指定from参数，否则将由默认账户发送，返回的是交易hash
    # 可以直接transact，也可以先使用buildTransaction，再使用web3.eth.send_transaction方法来发送，效果一样
    tx_hash = my_contract.constructor(100 * 10**18).transact({'from': w3.eth.accounts[3]})

    # 建立合约的第二种方法
    contract_data = my_contract.constructor(100 * 10**18).buildTransaction()
    tx_hash2 = w3.eth.send_transaction(contract_data)

    # 2.3 查看交易状态等，返回中会包括合约创建者地址，合约地址等关键信息
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f'\nTransaction receipt : { tx_receipt }')

    # 2.4 还可以查看一下ganache上发出合约的账户是否消耗了eth
    print("\nAccounts balance after send transaction ")
    for acc in w3.eth.accounts:
        print("Account " + acc + " : " + str(w3.eth.get_balance(acc)))


if __name__ =='__main__':
    main()