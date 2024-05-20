# Code 代码解析

:warning: **本文档侧重解析 V3 和 V2 的区别**，建议先看 [UniswapV2Interface Code](../../Uniswap-V2/Interface/Code.md)

## Swap

### useDerivedSwapInfo

从用户的输入数值来计算最佳的交易路径，这里和 V2 版本的区别主要两点：

- 同时计算了 V2 和 V3 的最佳交易链路
- 区分 V2，V3 ，layer2 的默认滑点百分比水平

```ts
// src/state/swap/hooks.ts
// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(toggledVersion: Version): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: string
  v2Trade: V2Trade<Currency, Currency, TradeType> | undefined
  v3TradeState: { trade: V3Trade<Currency, Currency, TradeType> | null; state: V3TradeState }
  toggledTrade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  allowedSlippage: Percent
} {
  ...

  // V2的最佳路径
  const bestV2TradeExactIn = useV2TradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrency ?? undefined, {
    maxHops: singleHopOnly ? 1 : undefined,
  })
  const bestV2TradeExactOut = useV2TradeExactOut(inputCurrency ?? undefined, !isExactIn ? parsedAmount : undefined, {
    maxHops: singleHopOnly ? 1 : undefined,
  })

  // V3的最佳路径
  const bestV3TradeExactIn = useBestV3TradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrency ?? undefined)
  const bestV3TradeExactOut = useBestV3TradeExactOut(inputCurrency ?? undefined, !isExactIn ? parsedAmount : undefined)

  const v2Trade = isExactIn ? bestV2TradeExactIn : bestV2TradeExactOut
  const v3Trade = (isExactIn ? bestV3TradeExactIn : bestV3TradeExactOut) ?? undefined

  ...

  const toggledTrade = (toggledVersion === Version.v2 ? v2Trade : v3Trade.trade) ?? undefined
  const allowedSlippage = useSwapSlippageTolerance(toggledTrade)

  ...

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    v2Trade: v2Trade ?? undefined,
    v3TradeState: v3Trade,
    toggledTrade,
    allowedSlippage,
  }
}
```

### useSwapSlippageTolerance

返回用户设置的滑点百分比，没有设置则返回默认

- layer2 模式的滑点 .10%
- V2 的默认滑点 .50%
- V3 的默认滑点 .50%

```ts
// src/hooks/useSwapSlippageTolerance.ts

const V2_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000); // .50%
const V3_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000); // .50%
const ONE_TENTHS_PERCENT = new Percent(10, 10_000); // .10%

export default function useSwapSlippageTolerance(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
): Percent {
  const { chainId } = useActiveWeb3React();
  const onL2 = chainId && L2_CHAIN_IDS.includes(chainId);
  const defaultSlippageTolerance = useMemo(() => {
    if (!trade || onL2) return ONE_TENTHS_PERCENT;
    if (trade instanceof V2Trade) return V2_SWAP_DEFAULT_SLIPPAGE;
    return V3_SWAP_DEFAULT_SLIPPAGE;
  }, [onL2, trade]);
  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance);
}
```

### useBestV3TradeExactOut

计算 V3 的指定精确输出时的最佳交易链路

- 获取所有可用的交易链路
- 批量请求 Quoter 合约的 quoteExactOutput 函数，得到预计输入数量的结果数组
- Qouter 合约会真实调用 Pool 的 swap 函数，而 swap 函数又会去调用 Quoter 合约的 uniswapV3SwapCallback 回调函数
- 回调函数中会把得到的输入输出量，作为 revert 信息传回

```ts
// src/hooks/useBestV3Trade.ts
/**
 * Returns the best v3 trade for a desired exact output swap
 * @param currencyIn the desired input currency
 * @param amountOut the amount to swap out
 */
export function useBestV3TradeExactOut(
  currencyIn?: Currency,
  amountOut?: CurrencyAmount<Currency>
): { state: V3TradeState; trade: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null } {
  const { chainId } = useActiveWeb3React();
  // 拿到quoter合约对象（V3部署的专门用来查询交易数量的合约）
  const quoter = useV3Quoter();
  // 获取所有可用的交易链路
  const { routes, loading: routesLoading } = useAllV3Routes(currencyIn, amountOut?.currency);

  // 组装查询quoter合约的入参 path, amountOut
  const quoteExactOutInputs = useMemo(() => {
    // 将path入参组装成 tokenA+fee+tokenB 的形式
    // `${tokenA.address}${fee rate}${tokenB.address}`
    // amountOut 转为十六进制
    return routes.map((route) => [encodeRouteToPath(route, true), amountOut ? `0x${amountOut.quotient.toString(16)}` : undefined]);
  }, [amountOut, routes]);

  // 批量请求Quoter合约的quoteExactOutput函数，得到预计输入数量的结果数组
  // Qouter合约会真实调用Pool的swap函数，而swap函数又会去调用uniswapV3SwapCallback回调函数
  // 回调函数中会把得到的输入输出量，作为revert信息传回
  const quotesResults = useSingleContractMultipleData(quoter, 'quoteExactOutput', quoteExactOutInputs, {
    gasRequired: chainId ? QUOTE_GAS_OVERRIDES[chainId] ?? DEFAULT_GAS_QUOTE : undefined,
  });

  return useMemo(() => {
    if (
      !amountOut ||
      !currencyIn ||
      quotesResults.some(({ valid }) => !valid) ||
      // skip when tokens are the same
      amountOut.currency.equals(currencyIn)
    ) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      };
    }

    if (routesLoading || quotesResults.some(({ loading }) => loading)) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      };
    }

    const { bestRoute, amountIn } = quotesResults.reduce(
      (currentBest: { bestRoute: Route<Currency, Currency> | null; amountIn: BigNumber | null }, { result }, i) => {
        if (!result) return currentBest;

        if (currentBest.amountIn === null) {
          return {
            bestRoute: routes[i],
            amountIn: result.amountIn,
          };
        } else if (currentBest.amountIn.gt(result.amountIn)) {
          return {
            bestRoute: routes[i],
            amountIn: result.amountIn,
          };
        }

        return currentBest;
      },
      {
        bestRoute: null,
        amountIn: null,
      }
    );

    if (!bestRoute || !amountIn) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      };
    }

    const isSyncing = quotesResults.some(({ syncing }) => syncing);

    return {
      state: isSyncing ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: Trade.createUncheckedTrade({
        route: bestRoute,
        tradeType: TradeType.EXACT_OUTPUT,
        inputAmount: CurrencyAmount.fromRawAmount(currencyIn, amountIn.toString()),
        outputAmount: amountOut,
      }),
    };
  }, [amountOut, currencyIn, quotesResults, routes, routesLoading]);
}
```

### useAllV3Routes

给定输入和输出的 token，计算所有可用的交易链路

- `useV3SwapPools` 返回所有和输入输出 token 相关的交易池
  - 常用的币种和 tokenA,tokenB 配对
  - 根据交易对去查找所有可用的费率等级（最多三种费率，费率不同即为不同的池子）
  - `usePools` 将 token 交易对初始化为 Pool 类 [详见 usePools](./#usePools)
- `useUserSingleHopOnly` 用户是否设置了仅限单池交易模式
  - 单池交易模式将只返回 tokenA->tokenB 交易对本身（不同费率的）
  - 非单池模式（可多个交易池），最多使用 2 个交易池（V2 最多 3 个）
- `computeAllRoutes` 遍历+递归查找可能的交易链路[详见 computeAllRoutes](./#computeAllRoutes)

```ts
/**
 * Returns all the routes from an input currency to an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export function useAllV3Routes(currencyIn?: Currency, currencyOut?: Currency): { loading: boolean; routes: Route<Currency, Currency>[] } {
  const { chainId } = useActiveWeb3React();
  const { pools, loading: poolsLoading } = useV3SwapPools(currencyIn, currencyOut);

  const [singleHopOnly] = useUserSingleHopOnly();

  return useMemo(() => {
    if (poolsLoading || !chainId || !pools || !currencyIn || !currencyOut) return { loading: true, routes: [] };

    const routes = computeAllRoutes(currencyIn, currencyOut, pools, chainId, [], [], currencyIn, singleHopOnly ? 1 : 2);
    return { loading: false, routes };
  }, [chainId, currencyIn, currencyOut, pools, poolsLoading, singleHopOnly]);
}
```

### usePools

将传入的 poolkey 数组初始化为一组交易池对象

- `slot0` 参见合约部分的讲解 [Pool slot0](../contractGuide/UniswapV3Pool.md#slot0)

```ts
export function usePools(poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]): [PoolState, Pool | null][] {
  const { chainId } = useActiveWeb3React();

  // tokenA tokenB 根据地址排序
  const transformed: ([Token, Token, FeeAmount] | null)[] = useMemo(() => {
    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      // 如果入参非法，则返回null
      if (!chainId || !currencyA || !currencyB || !feeAmount) return null;

      const tokenA = currencyA?.wrapped;
      const tokenB = currencyB?.wrapped;
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return null;
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
      return [token0, token1, feeAmount];
    });
  }, [chainId, poolKeys]);

  // 计算Pool的地址
  const poolAddresses: (string | undefined)[] = useMemo(() => {
    // 获取当前链上的factory合约地址
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId];

    // 调用sdk链下计算Pool地址
    // @uniswap/v3-sdk/utils.computePoolAddress
    // 利用@ethersproject/address/getCreate2Address方法，计算create2生成的地址
    return transformed.map((value) => {
      if (!v3CoreFactoryAddress || !value) return undefined;
      return computePoolAddress({
        factoryAddress: v3CoreFactoryAddress,
        tokenA: value[0],
        tokenB: value[1],
        fee: value[2],
      });
    });
  }, [chainId, transformed]);

  // 拿到所有Pool的slot0插槽数据
  // slot0是Pool合约将一些重要变量打包存储在storage，例如 sqrtPriceX96, tick 等
  // 因为这些变量加起来占用了255位，差一位 占满一个 word （256字节），并且存储在第一个插槽内
  // 固命名为slot0
  const slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0');
  // 拿到所有池子，当前激活的流动性总量
  // 即价格在区间内的所有流动性头寸的总和（不包括已经outOfRange的头寸）
  const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity');

  // 将交易对token包装成Pool对象
  // @uniswap/v3-sdk/Pool
  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      // token0,token1,fee 三个参数是必须的，如果有一个不存在，则返回null
      const [token0, token1, fee] = transformed[index] ?? [];
      if (!token0 || !token1 || !fee) return [PoolState.INVALID, null];

      const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index];
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index];

      // 组装slot0和liquidity，这两个也是必须的
      if (!slot0Valid || !liquidityValid) return [PoolState.INVALID, null];
      if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null];

      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null];

      // 如果池子的价格(根号价格) = 0 ,说明池子还未初始化
      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null];

      try {
        return [PoolState.EXISTS, new Pool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)];
      } catch (error) {
        console.error('Error when constructing the pool', error);
        return [PoolState.NOT_EXISTS, null];
      }
    });
  }, [liquidities, poolKeys, slot0s, transformed]);
}
```

### computeAllRoutes

遍历+递归查找可能的交易链路

```ts
function computeAllRoutes(
  currencyIn: Currency,
  currencyOut: Currency,
  pools: Pool[],
  chainId: number,
  currentPath: Pool[] = [],
  allPaths: Route<Currency, Currency>[] = [],
  startCurrencyIn: Currency = currencyIn,
  maxHops = 2
): Route<Currency, Currency>[] {
  const tokenIn = currencyIn?.wrapped;
  const tokenOut = currencyOut?.wrapped;
  if (!tokenIn || !tokenOut) throw new Error('Missing tokenIn/tokenOut');

  // 遍历候选的池子
  for (const pool of pools) {
    // 当前交易链路中已包含该池子，跳过
    // 当前交易链路中已包含输入的token，跳过
    // @uniswap/v3-sdk/Pool.involvesToken
    if (currentPath.indexOf(pool) !== -1 || !pool.involvesToken(tokenIn)) continue;

    const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0;
    if (outputToken.equals(tokenOut)) {
      // 当maxHops = 1时，输出token等于期望的种类，将交易对推入链路
      allPaths.push(new Route([...currentPath, pool], startCurrencyIn, currencyOut));
    } else if (maxHops > 1) {
      // 当maxHops > 1 时，递归查找
      computeAllRoutes(outputToken, currencyOut, pools, chainId, [...currentPath, pool], allPaths, startCurrencyIn, maxHops - 1);
    }
  }

  return allPaths;
}
```

## PoolList

### useV3Positions

根据用户账户地址向 Manager 合约查询他的所有 position

```ts
export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  // 拿到Manager合约的实例
  const positionManager = useV3NFTPositionManagerContract();

  // 查询用户在Manager上的position数量
  // (Manager.balanceOf 会返回创建的position数量，而非流动性数量)
  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(positionManager, 'balanceOf', [account ?? undefined]);

  // we don't expect any account balance to ever exceed the bounds of max safe int
  // 防止数量超过js的上限
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber();

  // 组装查询position的tokenId的入参： account.address , i 序号
  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = [];
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i]);
      }
      return tokenRequests;
    }
    return [];
  }, [account, accountBalance]);

  // 查询position所对应的tokenId
  // 调用 Manager.tokenOfOwnerByIndex 这是根据用户的position索引值查询 tokenId 的函数
  const tokenIdResults = useSingleContractMultipleData(positionManager, 'tokenOfOwnerByIndex', tokenIdsArgs);
  // 监听处于loading状态的请求
  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults]);

  // 组装查询结果，将 tokenId 包装成 BigNumber 类
  const tokenIds = useMemo(() => {
    if (account) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is Result => !!result)
        .map((result) => BigNumber.from(result[0]));
    }
    return [];
  }, [account, tokenIdResults]);

  // 根据tokenId 获取position详情
  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds);

  return {
    loading: someTokenIdsLoading || balanceLoading || positionsLoading,
    positions,
  };
}
```

### useV3PositionsFromTokenIds

根据 tokenId 获取 position 详情

```ts
function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
  // 拿到Manager合约的实例
  const positionManager = useV3NFTPositionManagerContract();
  // 组装入参 调用 Manager.positions 变量的getter函数
  const inputs = useMemo(() => (tokenIds ? tokenIds.map((tokenId) => [BigNumber.from(tokenId)]) : []), [tokenIds]);
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs);

  const loading = useMemo(() => results.some(({ loading }) => loading), [results]);
  const error = useMemo(() => results.some(({ error }) => error), [results]);

  // 组装position的详情数据
  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i];
        const result = call.result as Result;
        return {
          tokenId,
          fee: result.fee, //  当前position设置的费率等级
          // position收取的总手续费，从创建以来，包括已回收的
          // 两种资产分开收取 （每笔swap，从tokenIn收取）
          feeGrowthInside0LastX128: result.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: result.feeGrowthInside1LastX128,
          liquidity: result.liquidity, // position可提供的流动性数量
          nonce: result.nonce, // 用于授权的nonce值
          operator: result.operator, // 被授权的操作者 通常是 address 0
          tickLower: result.tickLower, // 价格区间左边界
          tickUpper: result.tickUpper, // 价格区间有边界
          token0: result.token0,
          token1: result.token1,
          tokensOwed0: result.tokensOwed0, // 当前未回收的fee (token0)
          tokensOwed1: result.tokensOwed1, // 当前未回收的fee (token1)
        };
      });
    }
    return undefined;
  }, [loading, error, results, tokenIds]);

  return {
    loading,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
  };
}
```

## CollectFee

回收手续费

### useV3PositionFees

通过 `ethers.callStatic` 方法，静态调用(不会真实消耗 gas) Manager 合约的 collect 函数，得到最新的可回收手续费的数量。

#### 为何要这样获取

- 从 Manager 的 positions getter 函数可以获取到手续费数量的数据
- 但这个数据不是最新的，因为 Manager 中的 position 的手续费只有在用户添加或删除流动性时才会触发去 Pool 合约中查询最新数据
- Manager 合约和 Pool 合约都存有 position 数据，但是 Pool 合约不会存储用户相关的信息，并且仅限 Pool 合约所对应的交易对；而 Manager 中会针对用户存储其所有交易对的全部 position 信息

#### Manager.collect() 函数的内部逻辑

1. Pool.burn 触发 Pool 中的 position 数据更新
2. Pool.positions getter 函数 拿到最新数据
3. Pool.collect 回收手续费，当然这里是 message call 可以返回计算后的数据，但不会改变链上的任何状态

我们需要的数据在 transfer 之前就已经拿到

```ts
// src/hooks/useV3PositionFees

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  asWETH = false
): [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined] {
  // Manager 合约实例
  const positionManager = useV3NFTPositionManagerContract(false);
  // 拿到tokenId对应的所有者地址
  const owner: string | undefined = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0];

  const tokenIdHexString = tokenId?.toHexString();
  const latestBlockNumber = useBlockNumber();

  // TODO find a way to get this into multicall
  // latestBlockNumber is included to ensure data stays up-to-date every block
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber]>();
  useEffect(() => {
    let stale = false;

    if (positionManager && tokenIdHexString && owner && typeof latestBlockNumber === 'number') {
      // 静态调用 Manager.collect 方法
      // 获取最新的两种资产的手续费
      // Manager.collect
      //  1. Pool.burn 触发Pool中的position数据更新
      //  2. Pool.positions getter 函数 拿到最新数据
      //  3. Pool.collect 回收手续费，当然这里不会实际转账
      //  返回的 amount0，amount1 是计算后的值，
      positionManager.callStatic
        .collect(
          {
            tokenId: tokenIdHexString,
            recipient: owner, // some tokens might fail if transferred to address(0)
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
          { from: owner } // need to simulate the call as the owner
        )
        .then((results) => {
          if (!stale) setAmounts([results.amount0, results.amount1]);
        });
    }

    return () => {
      stale = true;
    };
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber]);

  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token0) : pool.token0, amounts[0].toString()),
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token1) : pool.token1, amounts[1].toString()),
    ];
  } else {
    return [undefined, undefined];
  }
}
```

### collect

发送回收手续费的交易

- feeValue0/1 用户当前可取的手续费数量
- 通过 [useV3PositionFees()](#useV3PositionFees) 获取

```ts
// src/pages/Pool/PositionPage.tsx
const collect = useCallback(() => {
  // feeValue0/1 用户当前可取的手续费数量 通过 useV3PositionFees 获取
  if (!chainId || !feeValue0 || !feeValue1 || !positionManager || !account || !tokenId || !library) return;

  setCollecting(true);

  // 组装入参
  const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
    tokenId: tokenId.toString(),
    expectedCurrencyOwed0: feeValue0,
    expectedCurrencyOwed1: feeValue1,
    recipient: account,
  });

  const txn = {
    to: positionManager.address,
    data: calldata,
    value,
  };

  library
    .getSigner()
    .estimateGas(txn)
    .then((estimate) => {
      const newTxn = {
        ...txn,
        gasLimit: calculateGasMargin(chainId, estimate),
      };

      return library
        .getSigner()
        .sendTransaction(newTxn)
        .then((response: TransactionResponse) => {
          setCollectMigrationHash(response.hash);
          setCollecting(false);

          ReactGA.event({
            category: 'Liquidity',
            action: 'CollectV3',
            label: [feeValue0.currency.symbol, feeValue1.currency.symbol].join('/'),
          });

          addTransaction(response, {
            summary: `Collect ${feeValue0.currency.symbol}/${feeValue1.currency.symbol} fees`,
          });
        });
    })
    .catch((error) => {
      setCollecting(false);
      console.error(error);
    });
}, [chainId, feeValue0, feeValue1, positionManager, account, tokenId, addTransaction, library]);
```

## AddLiquidity

### useV3DerivedMintInfo

根据用户的输入计算预计添加流动性的数据，返回数据：

- `pool` Pool 对象，@uniswap/v3-sdk/Pool 类型的实例
- `poolState` Pool 的状态 LOADING | NOT_EXISTS | EXISTS | INVALID
- `ticks` 价格区间上下限所在的 tick
- `price` Pool 的价格(当前交易价格)
- `pricesAtTicks` 价格所在的 tick
- `currencies` tokenA 和 tokenB
- `currencyBalances` 用户在两个 token 上的余额
- `dependentField` 需要自动计算数量的 token
- `parsedAmounts` 格式化后的用户输入值(添加流动性的 token 数量)
- `position` position 实例
- `noLiquidity` Pool 是否没有流动性
- `errorMessage` 报错信息
- `invalidPool` Pool 是否非法
- `outOfRange` 当前交易价格是否在设定的价格区间之外
- `invalidRange` 非法的价格 (Lower >= Upper)
- `depositADisabled` 价格区间外不能注入 tokenA 的流动性
- `depositBDisabled` 价格区间外不能注入 tokenB 的流动性
- `invertPrice` 非法的价格 (在最大价格区间外)
- `ticksAtLimit` 最大价格区间所在的 tick

```ts
export function useV3DerivedMintInfo(
  currencyA?: Currency, // tokenA
  currencyB?: Currency, // tokenB
  feeAmount?: FeeAmount, // 费率水平 rate% = feeAmount / 10**6 %
  baseCurrency?: Currency, // 以哪个token为计价单位 例如 HH per ETH，ETH即为baseCurrency
  // override for existing position
  existingPosition?: Position // 当路由有positionId时，会获取链上的position信息从这里传入
): {
  pool?: Pool | null;
  poolState: PoolState;
  ticks: { [bound in Bound]?: number | undefined };
  price?: Price<Token, Token>;
  pricesAtTicks: {
    [bound in Bound]?: Price<Token, Token> | undefined;
  };
  currencies: { [field in Field]?: Currency };
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> };
  dependentField: Field;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  position: Position | undefined;
  noLiquidity?: boolean;
  errorMessage?: string;
  invalidPool: boolean;
  outOfRange: boolean;
  invalidRange: boolean;
  depositADisabled: boolean;
  depositBDisabled: boolean;
  invertPrice: boolean;
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };
} {
  const { account } = useActiveWeb3React();

  // 获取用户的输入数值
  const { independentField, typedValue, leftRangeTypedValue, rightRangeTypedValue, startPriceTypedValue } = useV3MintState();

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

  // currencies
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB]
  );

  // formatted with tokens
  // baseToken是用来计价的token 例如  HH per ETH，ETH即为baseToken
  const [tokenA, tokenB, baseToken] = useMemo(
    () => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped],
    [currencyA, currencyB, baseCurrency]
  );

  // token 地址排序，因为获取Pool地址需要以地址升序排列
  const [token0, token1] = useMemo(
    () => (tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined]),
    [tokenA, tokenB]
  );

  // balances
  // 拿到用户在两个token上的余额
  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]]);
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1],
  };

  // pool
  // 通过 tokenA,tokenB,fee 三个要素获取Pool对象
  // Pool对象是 @uniswap/v3-sdk/Pool 类的实例
  // poolState: LOADING | NOT_EXISTS | EXISTS | INVALID
  const [poolState, pool] = usePool(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B], feeAmount);
  // 根据pool状态判断是否存在流动性
  const noLiquidity = poolState === PoolState.NOT_EXISTS;

  // note to parse inputs in reverse
  // 标记计价token是否为token1（tokenA tokenB 排序之后，地址较大的）
  const invertPrice = Boolean(baseToken && token0 && !baseToken.equals(token0));

  // always returns the price with 0 as base token
  const price: Price<Token, Token> | undefined = useMemo(() => {
    // if no liquidity use typed value
    // 当Pool没有流动性，直接以用户输入的初始价格作为返回值
    if (noLiquidity) {
      // 解析用户输入值，并根据baseToken的精度换算值
      // 因为精度不同的两个token相除，价格需要根据精度的差来对小数点位移
      const parsedQuoteAmount = tryParseAmount(startPriceTypedValue, invertPrice ? token0 : token1);
      if (parsedQuoteAmount && token0 && token1) {
        // 获取计价token的价格，即价格为1
        const baseAmount = tryParseAmount('1', invertPrice ? token1 : token0);
        // 初始价格即为用户的输入数值 / 1
        const price =
          baseAmount && parsedQuoteAmount
            ? // @uniswap/sdk-core/Price
              new Price(baseAmount.currency, parsedQuoteAmount.currency, baseAmount.quotient, parsedQuoteAmount.quotient)
            : undefined;
        return (invertPrice ? price?.invert() : price) ?? undefined;
      }
      return undefined;
    } else {
      // get the amount of quote currency
      // 如果Pool已有流动性，则直接从链上获取Pool的价格数据
      // @uniswap/v3-sdk/Pool.priceOf(token0) 表示token0的价格，以token1计价
      return pool && token0 ? pool.priceOf(token0) : undefined;
    }
  }, [noLiquidity, startPriceTypedValue, invertPrice, token1, token0, pool]);

  // check for invalid price input (converts to invalid ratio)
  // 校验价格是否非法：能开根号，且没有超出最大价格范围
  const invalidPrice = useMemo(() => {
    // 计算根号价格
    // @uniswap/v3-sdk/encodeSqrtRatioX96
    const sqrtRatioX96 = price ? encodeSqrtRatioX96(price.numerator, price.denominator) : undefined;
    const invalid =
      price &&
      sqrtRatioX96 &&
      !(
        // @uniswap/v3-sdk/TickMath
        (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) && JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO))
      );
    return invalid;
  }, [price]);

  // used for ratio calculation when pool not initialized
  // 模拟的Pool对象，当Pool未初始化时，用于代替Pool对象做计算
  const mockPool = useMemo(() => {
    if (tokenA && tokenB && feeAmount && price && !invalidPrice) {
      const currentTick = priceToClosestTick(price);
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick);
      // @uniswap/v3-sdk/Pool
      return new Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), currentTick, []);
    } else {
      return undefined;
    }
  }, [feeAmount, invalidPrice, price, tokenA, tokenB]);

  // if pool exists use it, if not use the mock pool
  // 当Pool未初始化，使用模拟Pool对象做计算
  const poolForPosition: Pool | undefined = pool ?? mockPool;

  // lower and upper limits in the tick space for `feeAmount`
  // 设置tick序号的范围（上下限）
  // 根据tickSpacing查找最大值和最小值附近可用的tick的序号
  // tickSpacing 是计算时tick的间隔，为了减少计算量
  // 根据费率水平确定 费率越大，tickSpacing越大，反之亦然
  const tickSpaceLimits: {
    [bound in Bound]: number | undefined;
  } = useMemo(
    () => ({
      // @uniswap/v3-sdk/nearestUsableTick
      [Bound.LOWER]: feeAmount ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]) : undefined,
      [Bound.UPPER]: feeAmount ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]) : undefined,
    }),
    [feeAmount]
  );

  // parse typed range values and determine closest ticks
  // lower should always be a smaller tick
  // 根据价格区间上下限代表的tick序号
  // 以下限为例：
  //    1. 当用户下限的输入值为boolean类型，表示点击了 `set all range` 按钮
  //        此时下限价格是全价格轴上可用的最小值，即为 tickSpaceLimits.lower
  //    2. 当用户下限的输入值为数值类型，则根据用户输入价格查找最近的可用的tick序号
  //        因为Pool上的价格是离散的点，且又有tickSpacing的存在，
  //        用户输入的价格和实际匹配的tick所代表的价格，有一定偏差
  const ticks: {
    [key: string]: number | undefined;
  } = useMemo(() => {
    return {
      [Bound.LOWER]:
        typeof existingPosition?.tickLower === 'number'
          ? existingPosition.tickLower
          : (invertPrice && typeof rightRangeTypedValue === 'boolean') || (!invertPrice && typeof leftRangeTypedValue === 'boolean')
          ? tickSpaceLimits[Bound.LOWER]
          : invertPrice
          ? tryParseTick(token1, token0, feeAmount, rightRangeTypedValue.toString())
          : tryParseTick(token0, token1, feeAmount, leftRangeTypedValue.toString()),
      [Bound.UPPER]:
        typeof existingPosition?.tickUpper === 'number'
          ? existingPosition.tickUpper
          : (!invertPrice && typeof rightRangeTypedValue === 'boolean') || (invertPrice && typeof leftRangeTypedValue === 'boolean')
          ? tickSpaceLimits[Bound.UPPER]
          : invertPrice
          ? tryParseTick(token1, token0, feeAmount, leftRangeTypedValue.toString())
          : tryParseTick(token0, token1, feeAmount, rightRangeTypedValue.toString()),
    };
  }, [existingPosition, feeAmount, invertPrice, leftRangeTypedValue, rightRangeTypedValue, token0, token1, tickSpaceLimits]);

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks || {};

  // specifies whether the lower and upper ticks is at the exteme bounds
  // 判断价格上下限所在的tick是否为tick轴的最大最小序号
  const ticksAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
      [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    }),
    [tickSpaceLimits, tickLower, tickUpper, feeAmount]
  );

  // mark invalid range
  // 当价格的 Lower >= Upper 判定为非法价格区间
  const invalidRange = Boolean(typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper);

  // always returns the price with 0 as base token
  // 根据确定的tick序号反推实际区间上下限的价格
  // 用户在输入之后，通常价格会自动匹配到最近的tick上，和用户的输入值有偏差
  const pricesAtTicks = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice(token0, token1, ticks[Bound.LOWER]),
      [Bound.UPPER]: getTickToPrice(token0, token1, ticks[Bound.UPPER]),
    };
  }, [token0, token1, ticks]);
  const { [Bound.LOWER]: lowerPrice, [Bound.UPPER]: upperPrice } = pricesAtTicks;

  // liquidity range warning
  // 当前交易价格是否在设定的价格区间外
  const outOfRange = Boolean(!invalidRange && price && lowerPrice && upperPrice && (price.lessThan(lowerPrice) || price.greaterThan(upperPrice)));

  // amounts
  // 用户输入的要添加多少token作为流动性
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(typedValue, currencies[independentField]);

  // 自动计算另一种token匹配的数量
  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped;
    const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA;
    if (independentAmount && wrappedIndependentAmount && typeof tickLower === 'number' && typeof tickUpper === 'number' && poolForPosition) {
      // if price is out of range or invalid range - return 0 (single deposit will be independent)
      if (outOfRange || invalidRange) {
        return undefined;
      }

      // 根据输入的token数量创建一个Position实例
      // 其内部会计算另一种token的数量
      // @uniswap/v3-sdk/Position
      const position: Position | undefined = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? Position.fromAmount0({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount0: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the oretical position
          })
        : Position.fromAmount1({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount1: independentAmount.quotient,
          });

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(poolForPosition.token0) ? position.amount1 : position.amount0;
      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient);
    }

    return undefined;
  }, [independentAmount, outOfRange, dependentField, currencyB, currencyA, tickLower, tickUpper, poolForPosition, invalidRange]);

  const parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    };
  }, [dependentAmount, independentAmount, independentField]);

  // single deposit only if price is out of range
  // 当前交易价格在区间外,则只能添加单种资产
  const deposit0Disabled = Boolean(typeof tickUpper === 'number' && poolForPosition && poolForPosition.tickCurrent >= tickUpper);
  const deposit1Disabled = Boolean(typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent <= tickLower);

  // sorted for token order
  // 将不能添加流动性的资产映射到UI界面上
  // 界面上是tokenA tokenB,而上面计算时,采用排序后的 token0, token1
  const depositADisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && tokenA && poolForPosition.token0.equals(tokenA)) ||
        (deposit1Disabled && poolForPosition && tokenA && poolForPosition.token1.equals(tokenA))
    );
  const depositBDisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && tokenB && poolForPosition.token0.equals(tokenB)) ||
        (deposit1Disabled && poolForPosition && tokenB && poolForPosition.token1.equals(tokenB))
    );

  // create position entity based on users selection
  // 根据用户的选择配置创建Position实例
  // @uniswap/v3-sdk/Position
  const position: Position | undefined = useMemo(() => {
    if (!poolForPosition || !tokenA || !tokenB || typeof tickLower !== 'number' || typeof tickUpper !== 'number' || invalidRange) {
      return undefined;
    }

    // mark as 0 if disabled because out of range
    // outOfRange 状态下,某一种资产需要标记为0
    const amount0 = !deposit0Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
      : BIG_INT_ZERO;
    const amount1 = !deposit1Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient
      : BIG_INT_ZERO;

    if (amount0 !== undefined && amount1 !== undefined) {
      // 创建Position实例
      return Position.fromAmounts({
        pool: poolForPosition,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true, // we want full precision for the oretical position
      });
    } else {
      return undefined;
    }
  }, [parsedAmounts, poolForPosition, tokenA, tokenB, deposit0Disabled, deposit1Disabled, invalidRange, tickLower, tickUpper]);

  let errorMessage: string | undefined;
  if (!account) {
    errorMessage = t`Connect Wallet`;
  }

  if (poolState === PoolState.INVALID) {
    errorMessage = errorMessage ?? t`Invalid pair`;
  }

  if (invalidPrice) {
    errorMessage = errorMessage ?? t`Invalid price input`;
  }

  if ((!parsedAmounts[Field.CURRENCY_A] && !depositADisabled) || (!parsedAmounts[Field.CURRENCY_B] && !depositBDisabled)) {
    errorMessage = errorMessage ?? t`Enter an amount`;
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    errorMessage = t`Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance`;
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    errorMessage = t`Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance`;
  }

  const invalidPool = poolState === PoolState.INVALID;

  return {
    dependentField,
    currencies,
    pool,
    poolState,
    currencyBalances,
    parsedAmounts,
    ticks,
    price,
    pricesAtTicks,
    position,
    noLiquidity,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  };
}
```

### usePoolActiveLiquidity

获取 Pool 当前处于激活状态的流动性在 tick 轴上的分布，用于绘制分布图表

```ts
export function usePoolActiveLiquidity(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): {
  isLoading: boolean;
  isUninitialized: boolean;
  isError: boolean;
  error: any;
  activeTick: number | undefined;
  data: TickProcessed[] | undefined;
} {
  const pool = usePool(currencyA, currencyB, feeAmount);

  // Find nearest valid tick for pool in case tick is not initialized.
  // activeTick 是当前交易价格对应的tick(未必已初始化)
  // pool[1] 是@uniswap/v3-sdk/Pool 类的实例
  const activeTick = useMemo(() => getActiveTick(pool[1]?.tickCurrent, feeAmount), [pool, feeAmount]);

  // 通过graph获取Pool的所有处于激活状态的tick数据（已添加流动性的tick）
  const { isLoading, isUninitialized, isError, error, ticks } = useAllV3Ticks(currencyA, currencyB, feeAmount);

  return useMemo(() => {
    if (
      !currencyA ||
      !currencyB ||
      activeTick === undefined ||
      pool[0] !== PoolState.EXISTS ||
      !ticks ||
      ticks.length === 0 ||
      isLoading ||
      isUninitialized
    ) {
      return {
        isLoading: isLoading || pool[0] === PoolState.LOADING,
        isUninitialized,
        isError,
        error,
        activeTick,
        data: undefined,
      };
    }

    const token0 = currencyA?.wrapped;
    const token1 = currencyB?.wrapped;

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    // 当前价格对应的tick是否有流动性
    const pivot = ticks.findIndex(({ tickIdx }) => tickIdx > activeTick) - 1;

    // pivot < 0 说明当前价格对应的tick无流动性
    if (pivot < 0) {
      // consider setting a local error
      console.error('TickData pivot not found');
      return {
        isLoading,
        isUninitialized,
        isError,
        error,
        activeTick,
        data: undefined,
      };
    }

    // 当前价格对应的tick数据包装
    const activeTickProcessed: TickProcessed = {
      // 当前tick上的激活状态的流动性即为当前Pool激活的总流动性
      liquidityActive: JSBI.BigInt(pool[1]?.liquidity ?? 0),
      tickIdx: activeTick,
      // liquidityNet 是流动性净值，其含义可参见合约导读部分
      liquidityNet: Number(ticks[pivot].tickIdx) === activeTick ? JSBI.BigInt(ticks[pivot].liquidityNet) : JSBI.BigInt(0),
      // token0的价格
      price0: tickToPrice(token0, token1, activeTick).toFixed(PRICE_FIXED_DIGITS),
    };

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, true);

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, false);

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks);

    return {
      isLoading,
      isUninitialized,
      isError: isError,
      error,
      activeTick,
      data: ticksProcessed,
    };
  }, [currencyA, currencyB, activeTick, pool, ticks, isLoading, isUninitialized, isError, error]);
}
```

### computeSurroundingTicks

计算交易价格对应 tick 的 前/后 每个 tick 上的流动性数据

```ts
// Computes the numSurroundingTicks above or below the active tick.
export default function computeSurroundingTicks(
  token0: Token,
  token1: Token,
  activeTickProcessed: TickProcessed, // 当前价格对应tick上的数据
  sortedTickData: AllV3TicksQuery['ticks'], // Pool上所有已激活的 tick: { tickIdx, liquidityNet, price0, price1 }
  pivot: number, // 当前价格对应tick的序号，如果该tick未激活，pivot 为 -1
  ascending: boolean // 以当前价格的tick为起点 false 向前遍历 ture 向后遍历
): TickProcessed[] {
  let previousTickProcessed: TickProcessed = {
    ...activeTickProcessed,
  };
  // Iterate outwards (either up or down depending on direction) from the active tick,
  // building active liquidity for every tick.
  // 根据 ascending 的值，向前或向后遍历 每个tick上的流动性数据
  let processedTicks: TickProcessed[] = [];
  for (let i = pivot + (ascending ? 1 : -1); ascending ? i < sortedTickData.length : i >= 0; ascending ? i++ : i--) {
    const tickIdx = Number(sortedTickData[i].tickIdx);
    const currentTickProcessed: TickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tickIdx,
      liquidityNet: JSBI.BigInt(sortedTickData[i].liquidityNet),
      price0: tickToPrice(token0, token1, tickIdx).toFixed(PRICE_FIXED_DIGITS),
    };

    // Update the active liquidity.
    // If we are iterating ascending and we found an initialized tick we immediately apply
    // it to the current processed tick we are building.
    // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
    // 从当前价格向后（价格变大）方向遍历，每个tick上的激活流动性数量 =
    //   liquidityActive + liquidityNet
    if (ascending) {
      currentTickProcessed.liquidityActive = JSBI.add(previousTickProcessed.liquidityActive, JSBI.BigInt(sortedTickData[i].liquidityNet));
    } else if (!ascending && JSBI.notEqual(previousTickProcessed.liquidityNet, JSBI.BigInt(0))) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      // 从当前价格向后（价格变大）方向遍历，每个tick上的激活流动性数量 =
      //   liquidityActive - liquidityNet
      currentTickProcessed.liquidityActive = JSBI.subtract(previousTickProcessed.liquidityActive, previousTickProcessed.liquidityNet);
    }

    processedTicks.push(currentTickProcessed);
    previousTickProcessed = currentTickProcessed;
  }

  if (!ascending) {
    processedTicks = processedTicks.reverse();
  }

  return processedTicks;
}
```

### onAdd

发送添加流动性的交易，如果有必要，先创建 Pool 合约

```ts
// src/pages/AddLiuqidity/index.tsx

async function onAdd() {
  if (!chainId || !library || !account) return;

  if (!positionManager || !baseCurrency || !quoteCurrency) {
    return;
  }

  if (position && account && deadline) {
    // 交易对中有无ETH, 后面会根据此判断是否需给交易传value值
    const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined;
    // 判断池子是否存在，且流动性为0
    // 区分两种调用入参
    // @uniswap/v3-sdk/NonfungiblePositionManager
    //    1. 如果需要创建Pool，首先插入 Manager.createAndInitializePoolIfNecessary 的方法调用
    //    2. 如果有permit 插入permit的编码
    //    3. 如果不存在该流动性头寸(position)调用 Manager.mint 函数，添加流动性并创建NFT返回给用户
    //    4. 如果position已存在，调用 Manager.increaseLiquidity 直接添加流动性
    //    5. 如果交易对包含ETH，将ETH放在交易的value发送
    const { calldata, value } =
      hasExistingPosition && tokenId
        ? NonfungiblePositionManager.addCallParameters(position, {
            tokenId,
            slippageTolerance: allowedSlippage,
            deadline: deadline.toString(),
            useNative,
          })
        : NonfungiblePositionManager.addCallParameters(position, {
            slippageTolerance: allowedSlippage,
            recipient: account,
            deadline: deadline.toString(),
            useNative,
            createPool: noLiquidity,
          });

    // 组装交易参数
    let txn: { to: string; data: string; value: string } = {
      to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
      data: calldata,
      value,
    };

    if (argentWalletContract) {
      const amountA = parsedAmounts[Field.CURRENCY_A];
      const amountB = parsedAmounts[Field.CURRENCY_B];
      const batch = [
        ...(amountA && amountA.currency.isToken ? [approveAmountCalldata(amountA, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])] : []),
        ...(amountB && amountB.currency.isToken ? [approveAmountCalldata(amountB, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])] : []),
        {
          to: txn.to,
          data: txn.data,
          value: txn.value,
        },
      ];
      const data = argentWalletContract.interface.encodeFunctionData('wc_multiCall', [batch]);
      txn = {
        to: argentWalletContract.address,
        data,
        value: '0x0',
      };
    }

    // 打开交易进行中的弹窗
    setAttemptingTxn(true);

    // 交易预执行并预估gas费用
    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(chainId, estimate),
        };

        // 真实发送交易
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setAttemptingTxn(false);
            addTransaction(response, {
              summary: noLiquidity
                ? t`Create pool and add ${baseCurrency?.symbol}/${quoteCurrency?.symbol} V3 liquidity`
                : t`Add ${baseCurrency?.symbol}/${quoteCurrency?.symbol} V3 liquidity`,
            });
            setTxHash(response.hash);
            ReactGA.event({
              category: 'Liquidity',
              action: 'Add',
              label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
            });
          });
      })
      .catch((error) => {
        console.error('Failed to send transaction', error);
        setAttemptingTxn(false);
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error);
        }
      });
  } else {
    return;
  }
}
```

## RemoveLiquidity

### useDerivedV3BurnInfo

预估用户移除的流动性返回多少token和手续费

```ts
export function useDerivedV3BurnInfo(
  position?: PositionDetails,
  asWETH = false
): {
  position?: Position
  liquidityPercentage?: Percent
  liquidityValue0?: CurrencyAmount<Currency>
  liquidityValue1?: CurrencyAmount<Currency>
  feeValue0?: CurrencyAmount<Currency>
  feeValue1?: CurrencyAmount<Currency>
  outOfRange: boolean
  error?: string
} {
  const { account } = useActiveWeb3React()
  // 用户输入要移除的百分比
  const { percent } = useBurnV3State()

  const token0 = useToken(position?.token0)
  const token1 = useToken(position?.token1)

  // @uniswap/v3-sdk/Pool 类的实例
  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.fee)

  // @uniswap/v3-sdk/Position 类的实例
  const positionSDK = useMemo(
    () =>
      pool && position?.liquidity && typeof position?.tickLower === 'number' && typeof position?.tickUpper === 'number'
        ? new Position({
            pool,
            liquidity: position.liquidity.toString(),
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
          })
        : undefined,
    [pool, position]
  )

  // 格式化百分比数值
  const liquidityPercentage = new Percent(percent, 100)

  // 根据移除的百分比折算能够得到的token数量
  // discounted = total * persent
  // 这里的数字使用 分子/分母 的形式存储，而quotient中存储实际的结果
  const discountedAmount0 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount0.quotient).quotient
    : undefined
  const discountedAmount1 = positionSDK
    ? liquidityPercentage.multiply(positionSDK.amount1.quotient).quotient
    : undefined

  // token数量使用 @uniswap/sdk-core/CurrencyAmount 类包装
  const liquidityValue0 =
    token0 && discountedAmount0
      ? CurrencyAmount.fromRawAmount(asWETH ? token0 : unwrappedToken(token0), discountedAmount0)
      : undefined
  const liquidityValue1 =
    token1 && discountedAmount1
      ? CurrencyAmount.fromRawAmount(asWETH ? token1 : unwrappedToken(token1), discountedAmount1)
      : undefined

  // 获取可回收的手续费数量
  // 获取过程同回收手续费部分
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, position?.tokenId, asWETH)

  const outOfRange =
    pool && position ? pool.tickCurrent < position.tickLower || pool.tickCurrent > position.tickUpper : false

  let error: string | undefined
  if (!account) {
    error = t`Connect Wallet`
  }
  if (percent === 0) {
    error = error ?? t`Enter a percent`
  }
  return {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    outOfRange,
    error,
  }
}
```

### computeAmountFromLquidity

根据流动性数量和价格区间，计算其可换回的token数量，根据白皮书的公式有三种情况，以token1为例：（`current` 代表当前价格）

- `current < Lower`: 此时token1的数量已经耗尽，所以直接返回0
- `Lower < current < Upper`: `amount = (current - Lower) * liquidity`
- `Upper < current`: `amount = (Upper - Lower) * liquidity`
- 原理参考paco大佬的博客[从token数量计算流动性数量](https://liaoph.com/uniswap-v3-2/#%E4%BB%8E-token-%E6%95%B0%E8%AE%A1%E7%AE%97%E6%B5%81%E5%8A%A8%E6%80%A7-l)
- 具体代码在 @uniswap/v3-sdk/position.amount1()
