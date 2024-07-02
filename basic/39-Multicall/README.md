# Multicall

Multicall aggregates results from multiple contract **constant function calls**.
This reduces the number of separate JSON RPC requests that need to be sent (especially useful if using remote nodes like Infura), while also providing the guarantee that all values returned are from the same block (like an atomic read) and returning the block number the values are from (giving them important context so that results from old blocks can be ignored if they're from an out-of-date node).

This smart contract is intended to be used with **Multicall.js** in front-end dapps

## 合约调用方法

合约之间的调用有 2 种方式： 底层的 call 方式和 new 合约的方式

call：通过合约 ContractAddres.call(编码后的方法名和参数），返回调用是否成功，以及返回值 data

delegatecall ：设计是为了调用其它合约的 API 用的,类似于 Copy 了 API 合约的 API 函数到**本地合约**执行，会修改调用者合约的状态变量。

staticcall： Since byzantium staticcall can be used as well. This is basically the same as call, but will revert if the called function modifies the state in any way
eth.call 方法可以在本地节点执行方法；

## Multicall.js

Multicall.js 是一个轻量级的 JavaScript 库, 用于与多个智能合约进行交互.
Multicall.js 库具有以下这些特点:

- 在一次调用中获取多个智能合约函数调用的返回值
- 保证所有值都来自同一个块
- 使用观察者轮询多个区块链状态变量/函数
- 当观察者检测到状态发生变化时获取更新
- 不同步节点的结果会被自动忽略
- 获取新的区块更新

## indexed-finance-multicall.js

与常规 Muticall 合约调用不同，indexed-finance multicall 不用依赖链上已经部署成功的 multicall 合约，而是将 muticall 请求放到了待部署合约的 constructor 中，通过假部署的方式，拿到链上查询的结果。  
indexed-finance multicall 的“骚操作”：

1. constructor 中进行 muticall 请求
2. 利用 `assembly` 修改 evm 的返回数据，替换为 muticall 请求结果
   - 使用 `eth_call` 执行交易，在 EVM 中会先执行，再回退交易状态

```solidity
contract MultiCall {
    constructor(
        address[] memory targets,
        bytes[] memory datas
    ) public {
        uint256 len = targets.length;
        require(datas.length == len, "Error: Array lengths do not match.");

        bytes[] memory returnDatas = new bytes[](len);

        for (uint256 i = 0; i < len; i++) {
            address target = targets[i];
            bytes memory data = datas[i];
            (bool success, bytes memory returnData) = target.call(data);
            if (!success) {
                returnDatas[i] = bytes("");
            } else {
                returnDatas[i] = returnData;
            }
        }
        bytes memory data = abi.encode(block.number, returnDatas);
        assembly { return(add(data, 32), data) } // @notice: 这里是骚操作
    }
}
```

## 测试步骤

- 安装依赖

```shell
yarn
```

- 配置环境变量

```shell
cp .env.example .env

## 配置 .evn 文件中的 INFURA_ID
```

- 测试 makerdao-multicall.js

```shell
npx hardhat run scripts/makerdao-multicall.js
```

- 测试 indexed-finance-multicall.js

```shell
npx hardhat run scripts/indexed-finance-multicall.js
```

- 单元测试

```shell
npx hardhat test --network mainnet
```


TODO： 
https://github.com/Vectorized/multicaller/blob/main/src/MulticallerWithSender.sol 
## 参考链接

- Multicall.js github 地址: https://github.com/makerdao/multicall.js
- index finance github 地址: https://github.com/indexed-finance/dividends/tree/master/contracts
- Solidity Call 函数: https://www.jianshu.com/p/a5c97d0d7cae
- call/delegatecall/staticcall 介绍: https://zhuanlan.zhihu.com/p/35292014
