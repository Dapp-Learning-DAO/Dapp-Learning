from web3 import Web3
import json


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('./build/contracts/MyToken.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    # 1. 查看ganache上的输出，获取 transactionHash，替换下面的值（在shell界面上可以查看，转账记录有etherscan??），如果不能查看可以考虑重新deploy一个合约，得到其地址
    tx_receipt = w3.eth.get_transaction_receipt('0x3faffc7833d11110041f8d9abe07a21dd0eec3687c62c5c847e2a9931fd4f964')
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
    print(contract.address)
    print(contract.abi)
    print(contract.bytecode)
    for x in contract.functions:
        print(x)
    for x in contract.events:
        print(x)

    print(type(contract.functions.increaseAllowance))


if __name__ =='__main__':
    main()