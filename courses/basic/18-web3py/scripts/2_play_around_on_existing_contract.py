from web3 import Web3
import json


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('./build/contracts/MyToken.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    # 1. 进行合约部署，然后获取交易回执中的 contractAddress
    my_contract = w3.eth.contract(abi=erc20_json_dict['abi'], bytecode=erc20_json_dict['bytecode'])
    tx_hash = my_contract.constructor(100 * 10**18).transact({'from': w3.eth.accounts[3]})

    # 1.2 查看交易状态等，返回中会包括合约创建者地址，合约地址等关键信息
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_addr = tx_receipt['contractAddress']

    # 2. 生成该合约地址的合约对象，有两种方法
    contract = w3.eth.contract(address=contract_addr, abi=erc20_json_dict['abi'])

    ContractClass = w3.eth.contract(abi=erc20_json_dict['abi'])
    contract_method2 = ContractClass(address=contract_addr)

    # for acc in w3.eth.accounts:
    #     print(acc)
    # 3. 如果给予一个没有合约的地址会发生什么？我们来试一试
    # 3.1 使用与合约地址相差一个数字的地址来测试
    # 0xA094d630D172FC529ba5756e5c0af4695C75Cd56 exit
    # 0xA094d630D172FC529ba5756e5c0af4695C75Cd55 not exit
    # contract_test1 = w3.eth.contract(address='0xA094d630D172FC529ba5756e5c0af4695C75Cd55', abi=erc20_json_dict['abi'])
    # contract_test1 cannot pass checksum

    # 3.2 使用一个个人账号的地址来测试，这个地址能通过checksum测试
    contract_test2 = w3.eth.contract(address='0xCF156D72bEAEc66678fD33dEBdE574e9CD781F82', abi=erc20_json_dict['abi'])
    # nothing happen，说明能生成该合约对象，但是在发送的时候可能会发生错误

    # 4. 查看合约的各种属性，包括了address, abi, bytecode, functions, events
    # 其中functions和events是对abi进行了解析
    print(f'\nContract Address : {contract.address}')
    print(f'\nContract Abi: {contract.abi}')
    print(f'\nContract ByteCode: { erc20_json_dict["bytecode"] }')
    for x in contract.functions:
        print(f'Contract function : { x }')
    for x in contract.events:
        print(f'Contract event : { x }')

    print(type(contract.functions.increaseAllowance))


if __name__ =='__main__':
    main()