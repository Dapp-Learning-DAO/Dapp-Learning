# StarkNet

## intro

StarkNet 是一个无需许可的去中心化 ZK-Rollup，作为以太坊上的 L2 网络运行，任何 dApp 都可以在不影响以太坊的可组合性和安全性的情况下实现无限规模的计算。

`Cairo` 是一种用于编写可证明程序的编程语言，其中一方可以向另一方证明某个计算已正确执行。

StarkNet 将 Cairo 编程语言用于其基础设施和编写 StarkNet 合约。


## Setting up the environment

具体安装可以查看官方文档，这里以 Linux 环境为例 (Mac M1 芯片安装一直存在问题)

1. 为 Cairo 创建一个独立的 python 虚拟环境

   ```sh
   python3.7 -m venv ~/cairo_venv
   source ~/cairo_venv/bin/activate
   ```

   建议使用 python3.7 版本，其他版本可能有依赖安装问题

2. 安装 pip 依赖

   ```sh
   pip3 install ecdsa fastecdsa sympy
   ```

3. 安装 cairo-lang

   ```sh
   pip3 install cairo-lang
   ```

   验证是否安装成功

   ```sh
   # (cairo_venv) (python37)
   cairo-compile --version # cairo-compile 0.6.2
   ```

## Your first contract

### 创建 `contract.cairo` 文件

```python
# Declare this file as a StarkNet contract and set the required
# builtins.
%lang starknet

#%builtins directive is no longer required in StarkNet contracts since v0.7
%builtins pedersen range_check

from starkware.cairo.common.cairo_builtins import HashBuiltin

# Define a storage variable.
@storage_var
func balance() -> (res : felt):
end

# Increases the balance by the given amount.
@external
func increase_balance{
      syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
      range_check_ptr}(amount : felt):
   let (res) = balance.read()
   balance.write(res + amount)
   return ()
end

# Returns the current balance.
@view
func get_balance{
      syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
      range_check_ptr}() -> (res : felt):
   let (res) = balance.read()
   return (res)
end
```

- `%lang starknet` 声明该文件为 StarkNet contract, 需要使用 `starknet-compile` 命令来编译，而非 `cairo-compile`
- `%builtins pedersen range_check` 引入两个内建函数（%builtins 指令自v0.7起不再使用）
- `@storage_var` 声明 storage 变量
  - `balance.read()` 读取变量值
  - `balance.write(newValue)` 将 newValue 值写入 balance
  - 部署合约时，所有 storage 变量都将初始化为 0
- `@external` 外部调用方法
- `func increase_balance{pedersen_ptr：HashBuiltin*}`
  - 大括号内为声明的隐式参数 `Implicit arguments`
  - 隐式参数会自动向函数添加参数和返回值，而不用显式的在 return 语句中添加返回值
- `let (res) = ..` 声明局部变量

### 部署合约

命令行引入网络配置

```sh
export STARKNET_NETWORK=alpha-goerli
```

部署合约命令

```sh
starknet deploy --contract contract_compiled.json
```

部署成功后输出：

```sh
Deploy transaction was sent.
Contract address: 0x032e72fd53f838b7d4479fe38e4e33a8e95e06b3afaa197995e0046db2f5b97d
Transaction hash: 0x50b37bd192aed1fa131b83f1b034bc41f2b46174a2b93d8fb5ec326ca8b4679
```

### 与合约交互

`CONTRACT_ADDRESS` 替换为你的合约地址

```sh
starknet invoke \
    --address CONTRACT_ADDRESS \
    --abi contract_abi.json \
    --function increase_balance \
    --inputs 1234
```

调用成功，输出

```sh
Invoke transaction was sent.
Contract address: 0x032e72fd53f838b7d4479fe38e4e33a8e95e06b3afaa197995e0046db2f5b97d
Transaction hash: 0x139207f26d5e14507f62ff0f2eb68dcff43c107f1ee0a75489e8def0fbcc5bd
```

查询交易信息， `TRANSACTION_HASH` 替换为你的交易 hash

```sh
starknet tx_status --hash TRANSACTION_HASH
```

输出

```sh
{
    "block_hash": "0x6170597aaf501317aa8cdf762bca4295c7f3a2ab03e1b2e6811a257acc6d026",
    "tx_status": "ACCEPTED_ON_L2"
}
```

The possible statuses are:

- NOT_RECEIVED: The transaction has not been received yet (i.e., not written to storage).
- RECEIVED: The transaction was received by the sequencer.
- PENDING: The transaction passed the validation and entered the pending block.
- REJECTED: The transaction failed validation and thus was skipped.
- ACCEPTED_ON_L2: The transaction passed the validation and entered an actual created block.
- ACCEPTED_ON_L1: The transaction was accepted on-chain.

### Query the balance

`CONTRACT_ADDRESS` 替换为合约地址

```sh
starknet call \
    --address CONTRACT_ADDRESS \
    --abi contract_abi.json \
    --function get_balance
```

输出

```sh
1234
```

## to-do

- starknet 合约语法解析

## reference
- notion资料：https://doffice.notion.site/8becdf2c9365490e9b45c7e84f4f6113?v=9cc4feafb4244d3999cad0c464783897 
- official website <https://starkware.co/starknet/>
- develop docs <https://starknet.io/docs/index.html>
- blockscan <https://voyager.online/>
- StarkNet AMM demo <https://amm-demo.starknet.starkware.co/swap>
