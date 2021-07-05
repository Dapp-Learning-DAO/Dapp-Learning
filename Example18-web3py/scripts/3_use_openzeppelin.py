import json
from web3 import Web3


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('./build/contracts/MyTokenOpenZeppelin.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    my_contract = w3.eth.contract(abi=erc20_json_dict['abi'], bytecode=erc20_json_dict['bytecode'])
    tx_hash = my_contract.constructor(100 * 10 **18).transact({'from': w3.eth.accounts[0]})

    # 1. 使用my_contract类直接构建一个contract
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract = my_contract(address=tx_receipt['contractAddress'])
    print(contract.address)
    print(w3.eth.accounts[0])


    # 2. call和transact的区别
    # https://eattheblocks.com/call-vs-transaction-api-in-ethereum/
    # call()操作不上链，所以那些改变EVM状态的操作就无效，但是不消耗gas，最好对于view函数使用
    # transact()操作不能接受函数的返回值，因为是异步操作，对non view函数使用
    # 实在不按照这个规则来调用也是可以的

    return_value = contract.functions.name().call()
    print(return_value)
    tx_hash = contract.functions.name().transact({'from': w3.eth.accounts[0]})
    tx_receipt2 = w3.eth.get_transaction_receipt(tx_hash)

    # for k, v in tx_receipt2.items():
    #     print(k, v)

    # 3. 熟悉contract.functions.MyFunction().call()和w3.eth.call的操作方法
    # 使用buildTransaction会生成一个字典，包括多个字段，
    # 其中'data' 中包括基于该函数的ABI和函数名及函数参数生成相应的二进制数据
    # 与使用Contract.encodeABI是一样的结果
    transaction_data = contract.functions.name().buildTransaction()
    encoded_function_bytecode = contract.encodeABI(fn_name='name', args=None)

    assert transaction_data['data'] == encoded_function_bytecode

    xx = w3.eth.call(transaction_data)
    print(xx)
    print(contract.functions.name().call())
    # 这里两个方法返回的结果不一致，原因未知

    # 4. 查看ganachi上10个默认账户的Token数量，注意这里的Token与ETH的数量不是一个东西，使用的API也是不一样的，如下：
    print(w3.fromWei(w3.eth.get_balance(w3.eth.accounts[0]), 'ether'))
    # if decimal() of the Token is 18, could use fromWei function
    print(w3.fromWei(contract.functions.balanceOf(w3.eth.accounts[0]).call(), 'ether'))

    for acc in w3.eth.accounts:
        print(w3.fromWei(contract.functions.balanceOf(acc).call(), 'ether'))


    # 5. 使用ERC20的相关函数
    # 5.1 transferFrom(): test allowance utility

    print('5.1 ---- transferFrom')

    acc1 = w3.eth.accounts[0]
    acc2 = w3.eth.accounts[1]
    acc3 = w3.eth.accounts[2]
    decimal = contract.functions.decimals().call()

    # 从acc1授权给acc3操作acc1 22个Token的权限，如果单独执行第二条语句会revert
    tx_hash0 = contract.functions.approve(acc3, 22* 10**decimal).transact({"from": acc1})
    tx_hash = contract.functions.transferFrom(acc1, acc2, 22 * 10**decimal).transact({"from": acc3})

    for acc in w3.eth.accounts:
        print(w3.fromWei(contract.functions.balanceOf(acc).call(), 'ether'))

    # 5.2 _mint(): 使用铸币函数，合约创建者在创建合约的时候可以设置其能获得的初始Token数量，
    # 其他账户获得代币需要使用_mint()函数

    print('5.2 ---- mint')
    # 不能使用下列函数来铸币，因为_mint函数是internal的，不能从外部调用
    # 参考下一个.py文件中的方法，先构建一个mintable的合约，然后再赋予某个账户mint权限，进行铸币
    # _ = contract.functions._mint(w3.eth.accounts[3], 444 * 10**decimal).transact()

if __name__ =='__main__':
    main()