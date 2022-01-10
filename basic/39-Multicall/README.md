# Multicall  
我们在获取合约中数组时一般是采用的遍历的方法, 这个好像没什么太大问题. 但是如果提供节点服务的供应商对访问有限速, 那这种遍历的方法就挺蛋疼的.  
使用 multicall 合约, 可以聚合来自多个合约的调用结果, 减少需要发送的单独的JSON RPC请求的数量（如果使用像Infura这样的远程节点, 特别有用）, 同时也提供了保证, 所有返回的值都来自同一个区块（像原子读取).
下面将将介绍两种 multicall JS 库, Multicall.js 和  indexed-finance-multicall.js

## 合约调用方法
合约之间的调用有 2 种方式： 底层的 call 方式和 new 合约的方式   
call：通过合约 ContractAddres.call(编码后的方法名和参数），返回调用是否成功，以及返回值 data   
delegatecall ：设计是为了调用其它合约的 API 用的,类似于 Copy 了 API 合约的 API 函数到**本地合约**执行，会修改调用者合约的状态变量。   
staticcall： Since byzantium staticcall can be used as well. This is basically the same as call, but will revert if the called function modifies the state in any way
eth.call 方法可以在本地节点执行方法；

## Multicall.js
Multicall.js是一个轻量级的 JavaScript 库, 用于与多个智能合约进行交互. 
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
1. constructor中进行 muticall 请求
2. 利用 `assembly` 修改evm的返回数据，将本来为 revert 的信息，替换为muticall请求结果

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

## 参考链接  
- Multicall.js github 地址: https://github.com/makerdao/multicall.js     
- index finance github 地址: https://github.com/indexed-finance/dividends/tree/master/contracts
- Solidity Call 函数: https://www.jianshu.com/p/a5c97d0d7cae
- call/delegatecall/staticcall 介绍: https://zhuanlan.zhihu.com/p/35292014
