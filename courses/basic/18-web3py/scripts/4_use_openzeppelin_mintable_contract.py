import json
from web3 import Web3


def main():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    with open('./build/contracts/MyTokenMintable1.json', 'r') as fr:
        erc20_json_dict = json.load(fr)

    my_contract = w3.eth.contract(abi=erc20_json_dict['abi'], bytecode=erc20_json_dict['bytecode'])
    tx_hash = my_contract.constructor(w3.eth.accounts[1]).transact({'from': w3.eth.accounts[0]})

    # 0. 使用my_contract类直接构建一个contract
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract = my_contract(address=tx_receipt['contractAddress'])

    # 1. 测试account[1]的mint权限
    # 根据MyTokenMintable1的初始函数可以看到account[1]是被赋予了铸币权限
    print('1. ---- mint role')
    #print("ssss",w3.toHex(contract.functions.MINTER_ROLE().call()))
    #print("ttt",w3.toHex(w3.keccak(text="MINTER_ROLE")))
    print("Account " + w3.eth.accounts[1] + ", Mint Role : " ,contract.functions.hasRole(contract.functions.MINTER_ROLE().call(), w3.eth.accounts[1]).call())
    #print(w3.toHex(contract.functions.getRoleAdmin(contract.functions.MINTER_ROLE().call()).call()))

    # 2. 进行铸币，
    # 开始前查看所有账户的Token数量
    print('\n2. ---- check and mint')
    print("Before Mint")
    minter_role = contract.functions.MINTER_ROLE().call()
    for acc in w3.eth.accounts:
        print("Account " + acc + " Tokens Balance :" + str(contract.functions.balanceOf(acc).call()), ", Mint Role: " + str(contract.functions.hasRole(minter_role, acc).call()))

    # give everyone 10 Tokens
    print("\nAfter Mint")
    for acc in w3.eth.accounts:
        contract.functions.mint(to=acc, amount=10).transact({'from':w3.eth.accounts[1]})
        print("Account " + acc + " Tokens Balance :" + str(contract.functions.balanceOf(acc).call()), ", Mint Role: " + str(contract.functions.hasRole(minter_role, acc).call()))


if __name__ =='__main__':
    main()