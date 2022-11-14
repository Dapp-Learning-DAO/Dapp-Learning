# Multicall 模块解析

> 项目中几乎所有对于合约的 call 都是通过 Multicall 模块发送给 Multicall 合约，进行批量请求

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

- 遍历循环入参 calls，逐个调用目标合约的方法
- 将调用结果 `ret`，存入 `returnData[]` 中
- 如果遍历过程中某一方法失败，会终止执行所有进程
- 全部成功，将全部结果返回给调用者

```solidity
pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

contract Multicall {
    struct Call {
        address target;
        bytes callData;
    }
    function aggregate(Call[] memory calls) public returns (uint256 blockNumber, bytes[] memory returnData) {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);
        for(uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            require(success);
            returnData[i] = ret;
        }
    }
    // Helper functions
    ...
}
```

## StateData

- `callResults` 是调用的返回结果
- `callListeners` 是调用的监听器
  - 键为 `{contractAddress}-{methodid}{calldata}`
  - `blocksPerFetch` 是指在每个区块上有多少个相同的调用
    - 键：当前区块是 1，倒数第二个是 2...
    - 值：在该区块上有多少个相同的调用

Multicall 模块在 redux 中的 state 看起来是这样的：

```ts
{
  multicall: {
    callResults: {
      '4': {  // chainid
        // `{contractAddress}-{methodid}{calldata}`
        '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821-0x4d2301cc000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
          data: '0x000000000000000000000000000000000000000000000001ebf7caf35e327a08',   // 返回数据
          blockNumber: 9139591  // 区块高度
        },
        ...
      }
    },
    callListeners: {
      '4': {  // chainid
        '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821-0x4d2301cc000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
          // blocksPerFetch: value
          // 1 代表的是在当前区块上(已生成的最新区块)
          // 倒数第二个区块则是2，以此类推
          // 4 代表在这个区块上有多少次相同的调用 (合约地址，方法名，入参 三者完全一样)
          '1': 4,
          // 倒数第3个区块内，有5次相同的请求
          '3': 5,
          ...
        },
        ...
      }
    }
  }
}
```

## Reducer

初始化 Multicall state，并规定更新状态的方法

```ts
// src/state/multicall/reducer.ts
export interface MulticallState {
  callListeners?: {
    // on a per-chain basis
    [chainId: number]: {
      // stores for each call key the listeners' preferences
      // `{contractAddress}-{methodid}{calldata}`
      [callKey: string]: {
        // stores how many listeners there are per each blocks per fetch preference
        [blocksPerFetch: number]: number;
      };
    };
  };

  callResults: {
    [chainId: number]: {
      [callKey: string]: {
        data?: string | null;
        blockNumber?: number;
        fetchingBlockNumber?: number;
      };
    };
  };
}

const initialState: MulticallState = {
  callResults: {},
};

export default createReducer(initialState, (builder) =>
  builder
    // 每当有新的请求，会触发 add 事件，添加新的监听器
    // blocksPerFetch 默认是1 即代表当前区块
    .addCase(
      addMulticallListeners,
      (
        state,
        { payload: { calls, chainId, options: { blocksPerFetch = 1 } = {} } }
      ) => {
        const listeners: MulticallState["callListeners"] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {});
        listeners[chainId] = listeners[chainId] ?? {};
        calls.forEach((call) => {
          const callKey = toCallKey(call);
          listeners[chainId][callKey] = listeners[chainId][callKey] ?? {};
          // 这里比较绕，主要目的是为了记录相同调用的累加次数，作为后面判断是否优先重新请求的权重
          // 每当有相同的请求，这里的值会+1
          listeners[chainId][callKey][blocksPerFetch] =
            (listeners[chainId][callKey][blocksPerFetch] ?? 0) + 1;
        });
      }
    )
    // 移除请求监听器 (blocksPerFetch - 1)
    // 一般作为 useEffect 的返回方法，即每当useEffect被新触发时，会调用本方法清除上一轮useEffect产生的监听器
    // 具体原理请参考react hooks 机制
    .addCase(
      removeMulticallListeners,
      (
        state,
        { payload: { chainId, calls, options: { blocksPerFetch = 1 } = {} } }
      ) => {
        const listeners: MulticallState["callListeners"] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {});

        if (!listeners[chainId]) return;
        calls.forEach((call) => {
          const callKey = toCallKey(call);
          if (!listeners[chainId][callKey]) return;
          if (!listeners[chainId][callKey][blocksPerFetch]) return;

          // 移除监听器实际上是减少 blocksPerFetch 的值
          // 即减少其重新请求的优先级
          // 当 blocksPerFetch 减为0 直接移除监听器
          if (listeners[chainId][callKey][blocksPerFetch] === 1) {
            delete listeners[chainId][callKey][blocksPerFetch];
          } else {
            listeners[chainId][callKey][blocksPerFetch]--;
          }
        });
      }
    )
    // 更新事件，每次发送请求会触发，更新请求时的区块高度 fetchingBlockNumber
    .addCase(
      fetchingMulticallResults,
      (state, { payload: { chainId, fetchingBlockNumber, calls } }) => {
        state.callResults[chainId] = state.callResults[chainId] ?? {};
        calls.forEach((call) => {
          const callKey = toCallKey(call);
          const current = state.callResults[chainId][callKey];
          if (!current) {
            state.callResults[chainId][callKey] = {
              fetchingBlockNumber,
            };
          } else {
            if ((current.fetchingBlockNumber ?? 0) >= fetchingBlockNumber)
              return;
            state.callResults[chainId][callKey].fetchingBlockNumber =
              fetchingBlockNumber;
          }
        });
      }
    )
    // 请求返回错误时的事件，错误信息写入callResults
    .addCase(
      errorFetchingMulticallResults,
      (state, { payload: { fetchingBlockNumber, chainId, calls } }) => {
        state.callResults[chainId] = state.callResults[chainId] ?? {};
        calls.forEach((call) => {
          const callKey = toCallKey(call);
          const current = state.callResults[chainId][callKey];
          if (!current) return; // only should be dispatched if we are already fetching
          if (current.fetchingBlockNumber === fetchingBlockNumber) {
            delete current.fetchingBlockNumber;
            current.data = null;
            current.blockNumber = fetchingBlockNumber;
          }
        });
      }
    )
    // 请求成功时的事件，返回数据写入callResults
    .addCase(
      updateMulticallResults,
      (state, { payload: { chainId, results, blockNumber } }) => {
        state.callResults[chainId] = state.callResults[chainId] ?? {};
        Object.keys(results).forEach((callKey) => {
          const current = state.callResults[chainId][callKey];
          if ((current?.blockNumber ?? 0) > blockNumber) return;
          state.callResults[chainId][callKey] = {
            data: results[callKey],
            blockNumber,
          };
        });
      }
    )
);
```

## Updater

发送 Multicall 调用，并更新 state 数据

### fetchChunk

调用 Multicall 合约的方法

```ts
// chunk calls so we do not exceed the gas limit
// 每批次最多发送500个调用
const CALL_CHUNK_SIZE = 500;

/**
 * Fetches a chunk of calls, enforcing a minimum block number constraint
 * @param multicallContract multicall contract to fetch against
 * @param chunk chunk of calls to make
 * @param minBlockNumber minimum block number of the result set
 */
async function fetchChunk(
  multicallContract: Contract,
  chunk: Call[],
  minBlockNumber: number
): Promise<{ results: string[]; blockNumber: number }> {
  console.debug("Fetching chunk", multicallContract, chunk, minBlockNumber);
  let resultsBlockNumber, returnData;
  try {
    // 将批量请求组装成calls打包发送给 aggregate 方法
    [resultsBlockNumber, returnData] = await multicallContract.aggregate(
      chunk.map((obj) => [obj.address, obj.callData])
    );
  } catch (error) {
    console.debug("Failed to fetch chunk inside retry", error);
    throw error;
  }
  if (resultsBlockNumber.toNumber() < minBlockNumber) {
    // 如果返回的blockNumber 小于规定的过期区块高度 minBlockNumber
    // 抛出请求过期的错误
    console.debug(
      `Fetched results for old block number: ${resultsBlockNumber.toString()} vs. ${minBlockNumber}`
    );
    throw new RetryableError("Fetched for old block number");
  }
  return { results: returnData, blockNumber: resultsBlockNumber.toNumber() };
}
```

### activeListeningKeys

在每种相同的请求内，筛选出优先级最高的监听器

- 排除 `blocksPerFetch` <= 0 的监听器，说明已经没有实际的调用
- 找出同一种调用(合约地址，方法名，入参全部相同的)中，`blocksPerFetch` 最小的监听器，即最新的一个调用

```ts
/**
 * From the current all listeners state, return each call key mapped to the
 * minimum number of blocks per fetch. This is how often each key must be fetched.
 * @param allListeners the all listeners state
 * @param chainId the current chain id
 */
// 从最近的每种监听器中，筛选出每种调用 blocksPerFetch 最小的监听器
// blocksPerFetch 最小(排除 0 )，代表最新的一个监听器
export function activeListeningKeys(
  allListeners: AppState["multicall"]["callListeners"],
  chainId?: number
): { [callKey: string]: number } {
  if (!allListeners || !chainId) return {};
  const listeners = allListeners[chainId];
  if (!listeners) return {};

  return Object.keys(listeners).reduce<{ [callKey: string]: number }>(
    (memo, callKey) => {
      const keyListeners = listeners[callKey];

      memo[callKey] = Object.keys(keyListeners)
        .filter((key) => {
          const blocksPerFetch = parseInt(key);
          if (blocksPerFetch <= 0) return false;
          return keyListeners[blocksPerFetch] > 0;
        })
        .reduce((previousMin, current) => {
          return Math.min(previousMin, parseInt(current));
        }, Infinity);
      return memo;
    },
    {}
  );
}
```

### outdatedListeningKeys

接收`activeListeningKeys()`返回的列表，继续筛选出数据过期，需要发送请求的监听器列表

- 结果中没有数据，说明还未发送过请求，需要请求
- 结果中有数据
  - 有`fetchingBlockNumber`字段，说明正在请求中，或已成功请求返回数据
    - 根据`fetchingBlockNumber`判断是否过期
  - 没有`fetchingBlockNumber`字段，说明之前请求过，但是返回了错误
    - 没有`blockNumber`或 过期，需要请求

```ts
/**
 * Return the keys that need to be refetched
 * @param callResults current call result state
 * @param listeningKeys each call key mapped to how old the data can be in blocks
 * @param chainId the current chain id
 * @param latestBlockNumber the latest block number
 */
export function outdatedListeningKeys(
  callResults: AppState["multicall"]["callResults"],
  listeningKeys: { [callKey: string]: number },
  chainId: number | undefined,
  latestBlockNumber: number | undefined
): string[] {
  if (!chainId || !latestBlockNumber) return [];
  // 返回在当前链上的请求结果
  const results = callResults[chainId];
  // no results at all, load everything
  // 如果没有结果, 加载所有监听器
  if (!results) return Object.keys(listeningKeys);

  return Object.keys(listeningKeys).filter((callKey) => {
    const blocksPerFetch = listeningKeys[callKey];

    const data = callResults[chainId][callKey];
    // no data, must fetch
    // 没有data数据, 需要获取
    if (!data) return true;

    const minDataBlockNumber = latestBlockNumber - (blocksPerFetch - 1);

    // already fetching it for a recent enough block, don't refetch it
    // 已经获取了最近区块的请求, 无需重新获取
    if (
      data.fetchingBlockNumber &&
      data.fetchingBlockNumber >= minDataBlockNumber
    )
      return false;

    // if data is older than minDataBlockNumber, fetch it
    // 如果获取的当前 data 的区块区块高度小于设定的最新区块高度, 重新获取 data
    return !data.blockNumber || data.blockNumber < minDataBlockNumber;
  });
}
```

### retry

当传入方法执行失败时，尝试重试，返回撤销执行的方法和执行的结果

- 每次执行方法后，会在 minWait 和 maxWait 区间内随机出一个等待时间上限，超过则直接重试

```ts
// src/utils/retry.ts
/**
 * Retries the function that returns the promise until the promise successfully resolves up to n retries
 * @param fn 待执行的方法
 * @param n 最多执行多少次
 * @param minWait min wait between retries in ms
 * @param maxWait max wait between retries in ms
 *
 */
export function retry<T>(
  fn: () => Promise<T>,
  { n, minWait, maxWait }: { n: number; minWait: number; maxWait: number }
): { promise: Promise<T>; cancel: () => void } {
  // 是否已经完成请求, 默认false
  let completed = false;
  // 取消当前请求的方法
  let rejectCancelled: (error: Error) => void;

  const promise = new Promise<T>(async (resolve, reject) => {
    //将当前取消请求的方法赋值给rejectCancelled
    rejectCancelled = reject;
    while (true) {
      let result: T;
      try {
        // 尝试发起请求, 如果没有报错, 返回结果, 并将completed设为true
        result = await fn();
        if (!completed) {
          resolve(result);
          completed = true;
        }
        break;
      } catch (error) {
        // 如果报错, 但是completed为true, 跳过此次请求
        if (completed) {
          break;
        }
        // 如果重试次数小于等于0 或者 错误类型为不可重试的错误
        // 取消请求并返回报错
        if (n <= 0 || !(error instanceof RetryableError)) {
          reject(error);
          completed = true;
          break;
        }
        n--;
      }
      // 在一段时间(随机生成)后, 重新开始请求
      await waitRandom(minWait, maxWait);
    }
  });
  return {
    promise,
    cancel: () => {
      if (completed) return;
      completed = true;
      rejectCancelled(new CancelledError());
    },
  };
}
```

### Updater()

追踪监听器并发送请求

相关知识点：

- [需要清除的 effect](https://zh-hans.reactjs.org/docs/hooks-effect.html#%E9%9C%80%E8%A6%81%E6%B8%85%E9%99%A4%E7%9A%84-effect)
- [useRef](https://zh-hans.reactjs.org/docs/hooks-reference.html#useref)

```ts
export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector<AppState, AppState["multicall"]>(
    (state) => state.multicall
  );
  // wait for listeners to settle before triggering updates
  // 对state的变化做防抖处理，延迟100ms触发更新，100ms内如果有新变化，则重新计时
  const debouncedListeners = useDebounce(state.callListeners, 100);
  const latestBlockNumber = useBlockNumber();
  const { chainId } = useActiveWeb3React();
  // multicall合约对象
  const multicallContract = useMulticallContract();
  // 返回一个react ref对象，用于在updater()的生命周期外持久化储存取消调用的方法，每次调用updater都会返回同一个对象
  // 即每次触发useEffect时，都会先从ref中拿到上一轮请求的取消方法，然后执行取消操作
  // useRef() 和自建一个 {current: ...} 对象的唯一区别是，useRef 会在每次渲染时返回同一个 ref 对象
  const cancellations =
    useRef<{ blockNumber: number; cancellations: (() => void)[] }>();

  const listeningKeys: { [callKey: string]: number } = useMemo(() => {
    return activeListeningKeys(debouncedListeners, chainId);
  }, [debouncedListeners, chainId]);

  // 获取未序列化并且已经过期的所有监听器key值
  const unserializedOutdatedCallKeys = useMemo(() => {
    return outdatedListeningKeys(
      state.callResults,
      listeningKeys,
      chainId,
      latestBlockNumber
    );
  }, [chainId, state.callResults, listeningKeys, latestBlockNumber]);

  // 主要用于useEffect的监听
  // 进行排序并使用JSON转成字符串，能避免监听器顺序不同但数据没有变化，却触发更新的情况
  const serializedOutdatedCallKeys = useMemo(
    () => JSON.stringify(unserializedOutdatedCallKeys.sort()),
    [unserializedOutdatedCallKeys]
  );

  useEffect(() => {
    if (!latestBlockNumber || !chainId || !multicallContract) return;

    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys);
    if (outdatedCallKeys.length === 0) return;
    const calls = outdatedCallKeys.map((key) => parseCallKey(key));

    // 将数组根据指定大小进一步分割为数组块, 每一块子数组内部项目的数量相同/接近
    const chunkedCalls = chunkArray(calls, CALL_CHUNK_SIZE);

    // 先执行上一轮useEffect请求的取消方法
    if (cancellations.current?.blockNumber !== latestBlockNumber) {
      cancellations.current?.cancellations?.forEach((c) => c());
    }

    // 触发state的fetch事件
    dispatch(
      fetchingMulticallResults({
        calls,
        chainId,
        fetchingBlockNumber: latestBlockNumber,
      })
    );

    // 更新ref对象
    cancellations.current = {
      blockNumber: latestBlockNumber,
      // cancellations 存储本轮调用的撤销方法
      cancellations: chunkedCalls.map((chunk, index) => {
        // 使用retry包裹批量请求，拿到撤销retry的方法和批量调用的promise
        const { cancel, promise } = retry(
          () => fetchChunk(multicallContract, chunk, latestBlockNumber),
          {
            n: Infinity,
            minWait: 2500,
            maxWait: 3500,
          }
        );
        promise
          .then(({ results: returnData, blockNumber: fetchBlockNumber }) => {
            // 一旦批量调用成功，清空撤销方法，更新调用的区块高度（用于下一轮判断）
            cancellations.current = {
              cancellations: [],
              blockNumber: latestBlockNumber,
            };

            // accumulates the length of all previous indices
            // 计算索引值，用于更新结果
            const firstCallKeyIndex = chunkedCalls
              .slice(0, index)
              .reduce<number>((memo, curr) => memo + curr.length, 0);
            const lastCallKeyIndex = firstCallKeyIndex + returnData.length;

            // 触发state更新事件，依照索引值对应更新每个callkey的最新请求数据(可能有多次返回数据)
            // 并将结果根据callkey推入callResults
            dispatch(
              updateMulticallResults({
                chainId,
                results: outdatedCallKeys
                  .slice(firstCallKeyIndex, lastCallKeyIndex)
                  .reduce<{ [callKey: string]: string | null }>(
                    (memo, callKey, i) => {
                      memo[callKey] = returnData[i] ?? null;
                      return memo;
                    },
                    {}
                  ),
                blockNumber: fetchBlockNumber,
              })
            );
          })
          .catch((error: any) => {
            // 忽略用撤销方法引起的报错信息
            if (error instanceof CancelledError) {
              console.debug(
                "Cancelled fetch for blockNumber",
                latestBlockNumber
              );
              return;
            }
            console.error(
              "Failed to fetch multicall chunk",
              chunk,
              chainId,
              error
            );
            // 触发state 的error事件
            dispatch(
              errorFetchingMulticallResults({
                calls: chunk,
                chainId,
                fetchingBlockNumber: latestBlockNumber,
              })
            );
          });
        return cancel;
      }),
    };
  }, [
    chainId,
    multicallContract,
    dispatch,
    serializedOutdatedCallKeys,
    latestBlockNumber,
  ]);

  return null;
}
```

## hooks

页面中实际使用 Multicall 模块的调用钩子

### useCallsData

hooks 内部使用 state 的方法

- 对 calls 排序并排除无用的调用
- 当依赖的数据发生变化时触发 useEffect 更新调用的状态

```ts
// the lowest level call for subscribing to contract data
function useCallsData(
  calls: (Call | undefined)[],
  options?: ListenerOptions
): CallResult[] {
  const { chainId } = useActiveWeb3React();
  const callResults = useSelector<
    AppState,
    AppState["multicall"]["callResults"]
  >((state) => state.multicall.callResults);
  const dispatch = useDispatch<AppDispatch>();

  // 排序并剔除无用的调用(null|undefined)
  const serializedCallKeys: string = useMemo(
    () =>
      JSON.stringify(
        calls
          ?.filter((c): c is Call => Boolean(c))
          ?.map(toCallKey)
          ?.sort() ?? []
      ),
    [calls]
  );

  // update listeners when there is an actual change that persists for at least 100ms
  // 由于update的防抖机制,所以这里的更新间隔不会低于100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys);
    if (!chainId || callKeys.length === 0) return undefined;
    const calls = callKeys.map((key) => parseCallKey(key));
    // 触发state的add事件
    dispatch(
      addMulticallListeners({
        chainId,
        calls,
        options,
      })
    );

    return () => {
      // 当下一轮useEffect触发后,会调用这里返回的方法
      // 删除本轮的调用监听
      dispatch(
        removeMulticallListeners({
          chainId,
          calls,
          options,
        })
      );
    };
  }, [chainId, dispatch, options, serializedCallKeys]);

  return useMemo(
    () =>
      calls.map<CallResult>((call) => {
        if (!chainId || !call) return INVALID_RESULT;

        const result = callResults[chainId]?.[toCallKey(call)];
        let data;
        // 排除'0x'的结果
        if (result?.data && result?.data !== "0x") {
          data = result.data;
        }

        return { valid: true, data, blockNumber: result?.blockNumber };
      }),
    [callResults, calls, chainId]
  );
}
```

### toCallState

由于 state 中存储的结果数据是一个 16 进制数字串,所以需要一个结合接口返回类型,将结果解析成`CallState`类型对象的函数

```ts
interface CallState {
  // 是否有效
  readonly valid: boolean;
  // the result, or undefined if loading or errored/no data
  // 调用结果, 当还在加载或者报错或没有数据时, 为 undefined
  readonly result: Result | undefined;
  // true if the result has never been fetched
  // 如果结果从未被获取到时为 true
  readonly loading: boolean;
  // true if the result is not for the latest block
  // 是否同步, 如果结果不是来自最近的区块时为 true
  readonly syncing: boolean;
  // true if the call was made and is synced, but the return data is invalid
  // 当次调用已经完成且是同步过的, 但是返回的数据时无效的时候为 true
  readonly error: boolean;
}

// 当调用结果为无效数据时的状态
const INVALID_CALL_STATE: CallState = {
  valid: false,
  result: undefined,
  loading: false,
  syncing: false,
  error: false,
};

// 当还在获取调用数据时的状态
const LOADING_CALL_STATE: CallState = {
  valid: true,
  result: undefined,
  loading: true,
  syncing: true,
  error: false,
};

function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
  latestBlockNumber: number | undefined
): CallState {
  if (!callResult) return INVALID_CALL_STATE;
  const { valid, data, blockNumber } = callResult;
  if (!valid) return INVALID_CALL_STATE;
  if (valid && !blockNumber) return LOADING_CALL_STATE;
  if (!contractInterface || !fragment || !latestBlockNumber)
    return LOADING_CALL_STATE;
  const success = data && data.length > 2;
  const syncing = (blockNumber ?? 0) < latestBlockNumber;
  let result: Result | undefined = undefined;
  if (success && data) {
    try {
      // contractInterface 是ethers.contract.interface对象
      result = contractInterface.decodeFunctionResult(fragment, data);
    } catch (error) {
      console.debug("Result data parsing failed", fragment, data);
      return {
        valid: true,
        loading: false,
        error: true,
        syncing,
        result,
      };
    }
  }
  return {
    valid: true,
    loading: false,
    syncing,
    result: result,
    error: !success,
  };
}
```

### useSingleContractMultipleData

对同一个合约发起批量的请求(同一个方法,但参数不同)

```ts
export function useSingleContractMultipleData(
  contract: Contract | null | undefined, // 合约实例
  methodName: string, // 要调用的方法名
  callInputs: OptionalMethodInputs[], // 传入的参数, 传入多少组参数就调用几次
  options?: ListenerOptions // 传入监听器的配置项
): CallState[] {
  // 合约接口入参类型
  const fragment = useMemo(
    () => contract?.interface?.getFunction(methodName),
    [contract, methodName]
  );

  // 组装calls
  const calls = useMemo(
    () =>
      contract && fragment && callInputs && callInputs.length > 0
        ? callInputs.map<Call>((inputs) => {
            return {
              address: contract.address,
              callData: contract.interface.encodeFunctionData(fragment, inputs),
            };
          })
        : [],
    [callInputs, contract, fragment]
  );

  // 获取跟calls对应的结果数据
  const results = useCallsData(calls, options);

  const latestBlockNumber = useBlockNumber();

  return useMemo(() => {
    // toCallState 是对结果16进制数据,进行解析的函数
    return results.map((result) =>
      toCallState(result, contract?.interface, fragment, latestBlockNumber)
    );
  }, [fragment, contract, results, latestBlockNumber]);
}
```

### useMultipleContractSingleData

对多个合约发起相同方法和参数的请求

```ts
export function useMultipleContractSingleData(
  addresses: (string | undefined)[], // 多个要调用的合约的地址
  contractInterface: Interface, // 合约的接口
  methodName: string, // 调用的方法名
  callInputs?: OptionalMethodInputs, // 传入方法的参数值
  options?: ListenerOptions // 传入监听器的配置项
): CallState[] {
  const fragment = useMemo(
    () => contractInterface.getFunction(methodName),
    [contractInterface, methodName]
  );
  const callData: string | undefined = useMemo(
    () =>
      // 检查调用参数只能是 string 或 number 类型
      fragment && isValidMethodArgs(callInputs)
        ? contractInterface.encodeFunctionData(fragment, callInputs)
        : undefined,
    [callInputs, contractInterface, fragment]
  );

  const calls = useMemo(
    () =>
      fragment && addresses && addresses.length > 0 && callData
        ? addresses.map<Call | undefined>((address) => {
            return address && callData
              ? {
                  address,
                  callData,
                }
              : undefined;
          })
        : [],
    [addresses, callData, fragment]
  );

  const results = useCallsData(calls, options);

  const latestBlockNumber = useBlockNumber();

  return useMemo(() => {
    return results.map((result) =>
      toCallState(result, contractInterface, fragment, latestBlockNumber)
    );
  }, [fragment, results, contractInterface, latestBlockNumber]);
}
```

### useSingleCallResult

调用一个合约的单次请求

```ts
export function useSingleCallResult(
  contract: Contract | null | undefined,  // 要调用的合约的实例
  methodName: string, // 调用方法名
  inputs?: OptionalMethodInputs, // 传入方法的参数值
  options?: ListenerOptions // 传入监听器的配置项
): CallState {
  const fragment = useMemo(
    () => contract?.interface?.getFunction(methodName),
    [contract, methodName]
  );

  const calls = useMemo<Call[]>(() => {
    return contract && fragment && isValidMethodArgs(inputs)
      ? [
          {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragment, inputs),
          },
        ]
      : [];
  }, [contract, fragment, inputs]);

  const result = useCallsData(calls, options)[0];
  const latestBlockNumber = useBlockNumber();

  return useMemo(() => {
    return toCallState(
      result,
      contract?.interface,
      fragment,
      latestBlockNumber
    );
  }, [result, contract, fragment, latestBlockNumber]);
}
```
