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
- 批量请求Quoter合约的quoteExactOutput函数，得到预计输入数量的结果数组
- Qouter合约会真实调用Pool的swap函数，而swap函数又会去调用Quoter合约的uniswapV3SwapCallback回调函数
- 回调函数中会把得到的输入输出量，作为revert信息传回

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
    -
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

- `slot0` 参见合约部分的讲解 [Pool slot0](../contractGuid/UniswapV3Pool.md#slot0) 

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
