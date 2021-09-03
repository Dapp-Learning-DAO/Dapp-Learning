# Multicall 模块解析

> 项目中几乎所有对于合约的 call 都是通过 Multicall 模块发送给 Multicall 合约，进行批量请求

:warning: **本文档侧重解析 V3 和 V2 的区别**，建议先看 [V2 Multicall 解析文档](../../Uniswap-V2/Interface/Multicall.md)

![Multicall](./xmind/Multicall-min.png)

详细结构与调用关系图示 :point_right: [Multicall](./xmind/Multicall.png)

## 模块的特性

Multicall 使用链上的 Multicall 合约进行批量请求的模块，其具备以下特点：

- 针对请求的三个要素(合约地址/调用方法/调用参数)进行归档并建立追踪机制
  - 请求失败自动重连
  - 监听相关状态的改变(如区块高度，chainid 变化)，及时取消无用的请求，及时更新过期的数据
- 批量化请求
  - 将不同请求合并为一个个批次同时发送，节省 gas 费用
  - 保证每个请求批次不会超过最大 gas 限制
- `useSingleContractMultipleData` 对同一个合约发起批量的请求(同一个方法,但参数不同)
- `useMultipleContractSingleData` 对多个合约发起相同方法和参数的请求
- `useSingleCallResult` 调用一个合约的单次请求

三种调用方法的对比

| Multicall function            | contract address | contract methode | inputsdata |
| ----------------------------- | ---------------- | ---------------- | ---------- |
| useSingleContractMultipleData | 单个             | 相同             | 不同       |
| useMultipleContractSingleData | 多个             | 相同             | 不同       |
| useSingleCallResult           | 单个             | 相同             | 相同       |

## MulticallContract

这是一个辅助批量请求的合约，主要方法是 `aggregate`

- V3 使用的是 `Multicall2` 合约
  - 地址： `0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696`
  - 增加了 `tryAggregate` 方法，允许批量调用中存在失败的调用，用户设置 `requireSuccess` 为 false 时，不会因为某一个调用失败而终止执行，而是将所有调用执行完成后，返回所有调用结果和报错
- 遍历循环入参 calls，逐个调用目标合约的方法
- 将调用结果 `ret`，存入 `returnData[]` 中
- 如果遍历过程中某一方法失败，会终止执行所有进程
- 全部成功，将全部结果返回给调用者

```solidity
/**
 *Submitted for verification at Etherscan.io on 2021-03-23
*/

pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

/// @title Multicall2 - Aggregate results from multiple read-only function calls
/// @author Michael Elliot <mike@makerdao.com>
/// @author Joshua Levine <joshua@makerdao.com>
/// @author Nick Johnson <arachnid@notdot.net>

contract Multicall2 {
    struct Call {
        address target;
        bytes callData;
    }
    struct Result {
        bool success;
        bytes returnData;
    }

    function aggregate(Call[] memory calls) public returns (uint256 blockNumber, bytes[] memory returnData) {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);
        for(uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            require(success, "Multicall aggregate: call failed");
            returnData[i] = ret;
        }
    }
    ...
    function tryAggregate(bool requireSuccess, Call[] memory calls) public returns (Result[] memory returnData) {
        returnData = new Result[](calls.length);
        for(uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);

            if (requireSuccess) {
                require(success, "Multicall2 aggregate: call failed");
            }

            returnData[i] = Result(success, ret);
        }
    }
    function tryBlockAndAggregate(bool requireSuccess, Call[] memory calls) public returns (uint256 blockNumber, bytes32 blockHash, Result[] memory returnData) {
        blockNumber = block.number;
        blockHash = blockhash(block.number);
        returnData = tryAggregate(requireSuccess, calls);
    }
}
```

## V3 和 V2 的差别

### IheritMulticall

V3 的大部分周边合约都继承了一个名为`Multicall`的合约，其中有一个 `multicall(bytes[] calldata data)` 方法，所以 Manager 合约本身就是可以被`multicall`方法调用的（单独部署的 Multicall2 合约是为了方便调用非 UniswapV3 的合约，比如 ERC20 的 balanceOf）。

- 这里主要为了实现批量调用的同时，返回其中的 revert 信息
- V3 合约部分信息没有提供查询方法，比如预估交易进出的数量(可能是因为合约规模太大，已经达到 gas 限制)
- 支持批量 revert 查询查询

批量捕获 revert

- 通常 revert 消息可以在 try...catch...语句中捕获，但不包括 `call`, `delegatecall` 等底层方法，所以需要使用操作码来捕获信息
- revert 信息的读取：
  - revert 的数据大概是这样的：`{Error(string)的二进制码}`4 字节 + `data offset` 32 字节 + `data length` 32 字节 + `string data` + 32 字节
  - 如果返回是 revert 且带消息，其长度一定大于 68 （`result.length < 68` 的情况可以排除）
  - `result := add(result, 0x04)` 是将返回内存的指针向右移动 4 字节，忽略掉 `{Error(string)的二进制码}`，否则无法解析
  - 最后使用 `abi.decode` 解析出字符串
- [revert - solidity document](https://docs.soliditylang.org/en/latest/control-structures.html#revert)

```solidity
// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '../interfaces/IMulticall.sol';

/// @title Multicall
/// @notice Enables calling multiple methods in a single call to the contract
abstract contract Multicall is IMulticall {
    /// @inheritdoc IMulticall
    function multicall(bytes[] calldata data) external payable override returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            (bool success, bytes memory result) = address(this).delegatecall(data[i]);

            if (!success) {
                // Next 5 lines from https://ethereum.stackexchange.com/a/83577
                // If the result length is less than 68, then the transaction failed silently (without a revert message)
                if (result.length < 68) revert();
                assembly {
                    result := add(result, 0x04)
                }
                revert(abi.decode(result, (string)));
            }

            results[i] = result;
        }
    }
}
```

### fetchChunk

调用 Multicall2 合约的 `multicall` 方法

- 使用 `ethers.Contract.callStatic` 静态调用 （继承了）`Multicall2` 合约的 `multicall` 方法
- `ethers.callStatic` 的解析 [参见下方 callstatic](#callstatic):point_down:

```ts
const DEFAULT_GAS_REQUIRED = 1_000_000;

/**
 * Fetches a chunk of calls, enforcing a minimum block number constraint
 * @param multicall multicall contract to fetch against
 * @param chunk chunk of calls to make
 * @param blockNumber block number passed as the block tag in the eth_call
 */
async function fetchChunk(
  multicall: UniswapInterfaceMulticall,
  chunk: Call[],
  blockNumber: number
): Promise<{ success: boolean; returnData: string }[]> {
  console.debug('Fetching chunk', chunk, blockNumber);
  try {
    // 这里是V3和V2的主要差别
    // multicall代表调用合约继承了Multicall合约
    // callStatic是ethers的方法，不会产生gas费用
    const { returnData } = await multicall.callStatic.multicall(
      chunk.map((obj) => ({
        target: obj.address,
        callData: obj.callData,
        // 因为可能调用的是需要消耗gas的方法，所以必须设置一个gasLimit
        // 当然调用最终被revert，不会有gas费用
        gasLimit: obj.gasRequired ?? DEFAULT_GAS_REQUIRED,
      })),
      { blockTag: blockNumber }
    );

    if (process.env.NODE_ENV === 'development') {
      returnData.forEach(({ gasUsed, returnData, success }, i) => {
        if (!success && returnData.length === 2 && gasUsed.gte(Math.floor((chunk[i].gasRequired ?? DEFAULT_GAS_REQUIRED) * 0.95))) {
          console.warn(`A call failed due to requiring ${gasUsed.toString()} vs. allowed ${chunk[i].gasRequired ?? DEFAULT_GAS_REQUIRED}`, chunk[i]);
        }
      });
    }

    return returnData;
  } catch (error) {
    if (error.code === -32000 || error.message?.indexOf('header not found') !== -1) {
      throw new RetryableError(`header not found for block number ${blockNumber}`);
    }
    console.error('Failed to fetch chunk', error);
    throw error;
  }
}
```

### callStatic

- `ethers.callStatic` 底层实际上是 `jsonRpcProvider.send('call', args)`, 即 json-rpc 的 `eth_call` 接口
- `eth_call` 是 EVM 对链上合约发起的 `message call`，会假装消耗 gas 发送交易，EVM 会当作真实交易执行，把数据返回给调用者，**但是不会改变链上的任何数据**
- V3 中使用了这个技巧，使其可以不产生 gas 费的情况下查询一些不能直接获取的状态，比如预估交易的 tokenIn 或 tokenOut 数量
- [message call](https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html#message-calls)
- [ethers.contract.callStatic](https://docs.ethers.io/v5/api/contract/contract/#contract-callStatic)
- [json-rpc eth_call](https://eth.wiki/json-rpc/API#eth_call)

说明用例

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.7;

contract SimpleStorage {
    uint256 storedData;

    function set(uint256 x) public returns (uint256) {
        storedData = x;
        // 用staticCall调用 这里依然会返回计算后的结果
        // 但是不会改变链上的状态
        return storedData;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}
```

```ts
// test file
it('test ethers.staticCall', async function () {
  // simpleStorage 是一个ethers.Contract 类的实例
  const callStaticRes = await simpleStorage.callStatic.set(1);
  // callStatic 的结果应该是改变后的结果
  expect(callStaticRes).to.equals(1);
  // 但实际链上的数据是没有变化的
  expect(await simpleStorage.get()).to.equal(0);
});
```
