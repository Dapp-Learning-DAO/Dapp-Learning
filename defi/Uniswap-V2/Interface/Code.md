# Code代码解析

## Swap

### useDerivedSwapInfo


从用户的输入数值来计算最佳的交易路径

```ts
// src/state/swap/hooks.ts

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmount: CurrencyAmount | undefined
  v2Trade: Trade | undefined
  inputError?: string
  v1Trade: Trade | undefined
} {
  const { account } = useActiveWeb3React()

  const toggledVersion = useToggledVersion()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  // 如果接收者填写的是ENS域名，需要解析
  const recipientLookup = useENS(recipient ?? undefined)
  // 交易接收者默认为当前连接的钱包账户
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  // 获取当前选中的 token 的用户余额
  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined
  ])

  // isExactIn 交易模式 精确输入还是精确输出
  const isExactIn: boolean = independentField === Field.INPUT
  // 解析用户输入的数量
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  // 获取最优交易路径 根据交易模式赋值给 v2Trade
  const bestTradeExactIn = useTradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrency ?? undefined)
  const bestTradeExactOut = useTradeExactOut(inputCurrency ?? undefined, !isExactIn ? parsedAmount : undefined)

  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1]
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }

  // get link to trade on v1, if a better rate exists
  // 也要获取v1的最优路径，万一比v2还好呢
  const v1Trade = useV1Trade(isExactIn, currencies[Field.INPUT], currencies[Field.OUTPUT], parsedAmount)

  // 接下来是错误检查
  let inputError: string | undefined
  // 检查是否连接钱包
  if (!account) {
    inputError = 'Connect Wallet'
  }

  // 检查输入金额
  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  // 检查是否选了输入输出的token
  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  // 校验交易接收者地址
  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? 'Enter a recipient'
  } else {
    if (
      // BAD_RECIPIENT_ADDRESSES v2 相关的合约地址 factory router01 router02
      BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1 ||
      // 接收者地址不能存在于交易路径中
      (bestTradeExactIn && involvesAddress(bestTradeExactIn, formattedTo)) ||
      (bestTradeExactOut && involvesAddress(bestTradeExactOut, formattedTo))
    ) {
      inputError = inputError ?? 'Invalid recipient'
    }
  }

  // 获取用户设置的交易滑点百分比上限
  const [allowedSlippage] = useUserSlippageTolerance()

  // computeSlippageAdjustedAmounts
  // 根据用户指定的滑点大小, 计算并返回对应交易的最大输入和最小输出数量

  // 计算考虑滑点的情况下的输入 v2
  const slippageAdjustedAmounts = v2Trade && allowedSlippage && computeSlippageAdjustedAmounts(v2Trade, allowedSlippage)

  // 计算考虑滑点的情况下的输入 v1
  const slippageAdjustedAmountsV1 =
    v1Trade && allowedSlippage && computeSlippageAdjustedAmounts(v1Trade, allowedSlippage)

  // compare input balance to max input based on version
  // 比较用户的token余额与计算滑点后的输入数量
  // 根据 toggledVersion 选择的版本, 返回对应版本交易的最大输入数量
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    toggledVersion === Version.v1
      ? slippageAdjustedAmountsV1
        ? slippageAdjustedAmountsV1[Field.INPUT]
        : null
      : slippageAdjustedAmounts
      ? slippageAdjustedAmounts[Field.INPUT]
      : null
  ]

  // 若余额小于计算滑点后的数量 则报错
  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = 'Insufficient ' + amountIn.currency.symbol + ' balance'
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    v2Trade: v2Trade ?? undefined,
    inputError,
    v1Trade
  }
}
```

### useTradeExactOut

根据精确的输出数量，计算出预计的输入数量和最佳交易路径

```ts
// src/hooks/Trades.ts
/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  // 所有可用的交易对
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  // 单池交易模式
  // 用户是否禁用多交易对，即只使用一个交易对池子
  const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      // 如果是单池交易模式 不用考虑中转交易 直接返回当前的最优结果
      if (singleHopOnly) {
        return (
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      // 遍历最佳的交易路径
      // MAX_HOPS = 3 这里i = [1, 2, 3], i 代表了当前寻找的交易路径长度
      let bestTradeSoFar: Trade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        // 获取当前交易路径长度下的最优交易路径
        const currentTrade =
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        // 比较该交易路径是否可以使用更少的输入数量
        // BETTER_TRADE_LESS_HOPS_THRESHOLD = 50 / 10000 (千五)
        // 这里是比较 currentTrade * 100.5% < bestTradeSoFar
        // 由于i是递增的，所以这里 bestTradeSoFar 会比  currentTrade 长度少
        // 这里的阈值应该是考虑交易次数增加的gas费用
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
  }, [currencyIn, currencyAmountOut, allowedPairs, singleHopOnly])
}
```

### useAllCommonPairs

筛选 tokenA 和 tokenB 所有可用的交易对（包含中转交易对）

```ts
// src/hooks/Trades.ts

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

  // 默认的中转token
  // 主网有 WETH, DAI, USDC, USDT, COMP, MKR, WBTC
  // 测试网 只有 WETH
  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  // basePairs 由bases两两配对组成的交易对列表
  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  // 在所有可能的中转交易对中进行筛选
  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            // 单个交易池，返回两个token本身组成的交易对
            [tokenA, tokenB],
            // tokenA 和其他bases token组成的交易对
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // tokenB 和其他bases token组成的交易对
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...basePairs
          ]
            // 交易对两个token存在，且地址不同
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
            // 某些token只能通过特定的交易对交易，需要排除
            .filter(([tokenA, tokenB]) => {
              if (!chainId) return true
              const customBases = CUSTOM_BASES[chainId]
              if (!customBases) return true

              const customBasesA: Token[] | undefined = customBases[tokenA.address]
              const customBasesB: Token[] | undefined = customBases[tokenB.address]

              if (!customBasesA && !customBasesB) return true

              if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false
              if (customBasesB && !customBasesB.find(base => tokenA.equals(base))) return false

              return true
            })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  )

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  // 校验合法性和去重
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          // 交易池子需要存在
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          // 去重
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}
```

### bestTradeExactOut

限定使用交易路径的长度(交易对数量)，在交易对中寻找所有可能的交易路径，并进行最优排序，第一个元素为最优的交易路径

- 这是sdk中的方法 `@uniswap/sdk/Trade.bestTradeExactOut`
- 该方法主要接受三个参数：交易对数组， 精确的输出数量，递归深度(交易路径的长度)
- 遍历交易对数组，然后对每个交易对进行递归查找，找到头尾符合输入输出的路径会排序并插入到结果中
- 最终返回一个交易路径组成的数组，第一个元素为最优的交易路径

### useSwapCallback

向router合约发起交易，返回交易的 状态，回调，报错

```ts
// src/hooks/useSwapCallback.ts

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  // 遍历交易路径 获得由调用函数名和相关参数组成的数组
  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName)

  // 发送交易的钩子
  const addTransaction = useTransactionAdder()

  // 交易接收者
  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  // 返回交易的 状态，回调，报错
  return useMemo(() => {
    // 校验非法交易
    if (!trade || !library || !account || !chainId) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    // 检测是什么原因导致交易接收者不存在 
    if (!recipient) {
      // 如果作为传入 useENS 的参数 recipientAddressOrName 存在, 说明当前为无效的接收者
      // 否则表示当前接收者还在获取状态中
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    const tradeVersion = getTradeVersion(trade)

    return {
      // 交易状态 通过校验
      state: SwapCallbackState.VALID,
      // 交易的回调方法
      callback: async function onSwap(): Promise<string> {
        // 针对每笔交易依次进行预执行 估算gas 并在实际交易发出之前提前发现错误
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map(call => {
            const {
              parameters: { methodName, args, value },
              contract
            } = call
            const options = !value || isZero(value) ? {} : { value }

            // 返回调用及其预计的gas费用
            return contract.estimateGas[methodName](...args, options)
              .then(gasEstimate => {
                return {
                  call,
                  gasEstimate
                }
              })
              .catch(gasError => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)

                // 预计算失败，尝试静态调用合约方法
                return contract.callStatic[methodName](...args, options)
                  .then(result => {
                    // 静态调用成功 抛出错误 建议重新调用
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch(callError => {
                    // 静态调用失败 抛出失败类型
                    console.debug('Call threw error', call, callError)
                    let errorMessage: string
                    switch (callError.reason) {
                      case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
                      case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
                        errorMessage =
                          'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
                        break
                      default:
                        errorMessage = `The transaction cannot succeed due to error: ${callError.reason}. This is probably an issue with one of the tokens you are swapping.`
                    }
                    return { call, error: new Error(errorMessage) }
                  })
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        // 判断交易预执行是否成功
        // 交易若执行成功会存在 gasEstimate 字段代表gas预估数值 bignumber类型
        // 若成功 应至少存在一项满足条件
        const successfulEstimation = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )

        // 若全部失败 抛出最后一个错误
        if (!successfulEstimation) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          throw new Error('Unexpected error. Please contact support: none of the calls threw an error')
        }

        // 取出第一个预执行成功的交易 真实发送交易
        const {
          call: {
            contract,
            parameters: { methodName, args, value }
          },
          gasEstimate
        } = successfulEstimation

        return contract[methodName](...args, {
          // gasLimit 设置为预计gas费用上浮 10%
          gasLimit: calculateGasMargin(gasEstimate),
          ...(value && !isZero(value) ? { value, from: account } : { from: account })
        })
          .then((response: any) => {
            // 发送交易成功 生成交易概览
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const inputAmount = trade.inputAmount.toSignificant(3)
            const outputAmount = trade.outputAmount.toSignificant(3)

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`

            const withVersion =
              tradeVersion === Version.v2 ? withRecipient : `${withRecipient} on ${(tradeVersion as any).toUpperCase()}`

            // 将交易相关信息推入 transaction state
            addTransaction(response, {
              summary: withVersion
            })

            // 返回交易hash
            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            // 如果用户拒绝了交易, 返回这项自定义报错
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              // 否则, 我们应当如实返回这个意外错误
              console.error(`Swap failed`, error, methodName, args, value)
              throw new Error(`Swap failed: ${error.message}`)
            }
          })
      },
      error: null
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransaction])
}
```

### useSwapCallArguments

解析交易对生成用于调用router合约的方法名和参数

```ts
// src/hooks/useSwapCallback.ts

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
function useSwapCallArguments(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()

  const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)

  return useMemo(() => {
    const tradeVersion = getTradeVersion(trade)
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId || !deadline) return []

    const contract: Contract | null =
      tradeVersion === Version.v2 ? getRouterContract(chainId, library, account) : v1Exchange
    if (!contract) {
      return []
    }

    // 遍历交易路径 将调用方法名称和参数存入数组
    const swapMethods = []

    // 区分v2和v1
    switch (tradeVersion) {
      case Version.v2:
        swapMethods.push(
          // @uniswap/v2-sdk/Router
          // 返回调用router合约的 methodName, args, value(eth)
          Router.swapCallParameters(trade, {
            feeOnTransfer: false,
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          swapMethods.push(
            Router.swapCallParameters(trade, {
              feeOnTransfer: true,
              allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
              recipient,
              deadline: deadline.toNumber()
            })
          )
        }
        break
      case Version.v1:
        swapMethods.push(
          v1SwapArguments(trade, {
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )
        break
    }
    return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade, v1Exchange])
}

```

## Approve

### useApproveCallback

返回当前token对于router合约的approve状态，和向token合约发起approve授权的方法<br>

```ts
// approve 状态 :
// UNKNOWN 未知
// NOT_APPROVED 还未被授权
// PENDING 获取授权中
// APPROVED 已授权
export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED
}
```

```ts
// src/hooks/useApproveCallback.ts
// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { account } = useActiveWeb3React()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined

  // useTokenAllowance会发起一个 multicall 调用，查询token对于router合约的allowance
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  // 判断该token是否已有pending状态的授权交易 (之前已发送过approve)
  // 具体方法是在 transaction state 内部筛选符合条件的交易记录
  // 1. 没有reciept，即交易还在进行中 (pending)
  // 2. 记录有 approval 属性 且 spender, token 符合
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // check the current approval status
  // 检查allowance 数量，返回approval状态
  // 1. pending 2. not approved 3. approved
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === ETHER) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    // 当我们可能没有足够的信息来确认当前token是否需要我们调用授权
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    // 如果当前操作的token的数量小于已授权的token数量, 直接返回已授权状态
    // 否则需要另外授权, 根据 pendingApproval 来确定是否在获取授权的状态中
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  // 根据当前的token地址, 获取对应的合约实例
  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  // 生成approve授权方法
  const approve = useCallback(async (): Promise<void> => {
    // 检查是否成功授权当前token
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    // 检查token是否存在
    if (!token) {
      console.error('no token')
      return
    }

    // 检查token对应的合约
    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    // 检查授权的数量是否已经设定
    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    // 检查spender是否存在
    if (!spender) {
      console.error('no spender')
      return
    }

    // 是否精确授权数量 默认最大数量授权
    let useExact = false
    // 先预执行最大数量授权 如果失败尝试精确数量的授权
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString())
    })

    // 实际发送交易
    return tokenContract
      .approve(spender, useExact ? amountToApprove.raw.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas)  //  gasLimit 为预估数量上浮10%
      })
      .then((response: TransactionResponse) => {
        // 若发送交易成功 添加 transaction state
        addTransaction(response, {
          summary: 'Approve ' + amountToApprove.currency.symbol,
          approval: { tokenAddress: token.address, spender: spender }
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction])

  return [approvalState, approve]
}
```

## Transaction

### TransactionReducer

Transaction State 的更新逻辑

```ts
// src/state/transactions/reducer.ts

export const initialState: TransactionState = {}

export default createReducer(initialState, builder =>
  builder
    .addCase(addTransaction, (transactions, { payload: { chainId, from, hash, approval, summary, claim } }) => {
      // 校验添加的新交易记录是否已存在
      if (transactions[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions[chainId] ?? {}
      txs[hash] = { hash, approval, summary, claim, from, addedTime: now() }
      transactions[chainId] = txs
    })
    .addCase(clearAllTransactions, (transactions, { payload: { chainId } }) => {
      // 清空所有交易记录
      if (!transactions[chainId]) return
      transactions[chainId] = {}
    })
    .addCase(checkedTransaction, (transactions, { payload: { chainId, hash, blockNumber } }) => {
      // 检查交易状态的变化
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      // 更新 lastCheckedBlockNumber 字段
      // 如果 lastCheckedBlockNumber 不存在, 将以 blockNumber 作为值
      // 否则比较 blockNumber 与 lastCheckedBlockNumber, 以大的那个作为值
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
      }
    })
    .addCase(finalizeTransaction, (transactions, { payload: { hash, chainId, receipt } }) => {
      // 交易确认事件
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      // 为记录添加交易返回数据 和 确认时间戳
      tx.receipt = receipt
      tx.confirmedTime = now()
    })
)
```

### userTransactionAdder

添加新的交易记录 (hook)

```ts
// src/state/transactions/hooks.tsx

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: { summary?: string; approval?: { tokenAddress: string; spender: string }; claim?: { recipient: string } }
) => void {
  const { chainId, account } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  // 除了交易本身的信息，额外添加了交易概览，approval授权结果，claim空头字段
  return useCallback(
    (
      response: TransactionResponse,
      {
        summary,
        approval,
        claim
      }: { summary?: string; claim?: { recipient: string }; approval?: { tokenAddress: string; spender: string } } = {}
    ) => {
      if (!account) return
      if (!chainId) return

      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from: account, chainId, approval, summary, claim }))
    },
    [dispatch, chainId, account]
  )
}
```

### TransactionUpdater

监听最近的交易历史，更新交易 state 与 UI

```ts
// src/state/transactions/updater.tsx
export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()

  // 获取最新的区块高度
  const lastBlockNumber = useBlockNumber()

  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const transactions = chainId ? state[chainId] ?? {} : {}

  // 显示交易确认弹窗的方法
  const addPopup = useAddPopup()

  // 利用 useEffect 机制监听，一旦有依赖参数变化，触发 useEffect 方法更新交易记录
  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return

    // 从所有记录中筛选出需要检查的记录
    // 详细筛选逻辑参见 shouldCheck
    Object.keys(transactions)
      .filter(hash => shouldCheck(lastBlockNumber, transactions[hash]))
      .forEach(hash => {
        // 遍历请求交易状态
        library
          .getTransactionReceipt(hash)
          .then(receipt => {
            // 如果得到交易结果 触发 finalizeTransaction 事件，修改交易状态为完成
            if (receipt) {
              dispatch(
                finalizeTransaction({
                  chainId,
                  hash,
                  receipt: {
                    blockHash: receipt.blockHash,
                    blockNumber: receipt.blockNumber,
                    contractAddress: receipt.contractAddress,
                    from: receipt.from,
                    status: receipt.status,
                    to: receipt.to,
                    transactionHash: receipt.transactionHash,
                    transactionIndex: receipt.transactionIndex
                  }
                })
              )

              // 显示交易已确认的提示窗口
              addPopup(
                {
                  txn: {
                    hash,
                    success: receipt.status === 1,
                    summary: transactions[hash]?.summary
                  }
                },
                hash
              )
            } else {
              // 交易还没有结果，发送 checkedTransaction 事件继续监听
              dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
            }
          })
          .catch(error => {
            console.error(`failed to check transaction hash: ${hash}`, error)
          })
      })
  }, [
    // 会在以下状态发生变化时，再次执行上述交易监听请求
    // 其中，导致更新最多的是 lastBlockNumber
    chainId,  // 当前 Chain ID
    library,  // web3 provider
    transactions,  // 交易记录
    lastBlockNumber,  // 最新区块
    dispatch,  // dispatch 函数
    addPopup  // 添加弹窗函数
  ])

  return null
}
```

### shouldCheck

判断当前交易记录是否需要监听的方法

```ts
// src/state/transactions/updater.tsx
export function shouldCheck(
  lastBlockNumber: number,
  tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number }
): boolean {
  // 排除已完成的交易
  if (tx.receipt) return false
  // 没有lastCheckedBlockNumber字段表示该交易刚刚发送，还没有监听过
  if (!tx.lastCheckedBlockNumber) return true
  // 排除距离上次检查间隔小于一个区块的记录
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) return false
  // 处于pending状态多少分钟
  const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60
  if (minutesPending > 60) {
    // every 10 blocks if pending for longer than an hour
    // 对于pending 超过60分钟的记录，只监听区块距离现在超过9的记录(防止积累太多)
    return blocksSinceCheck > 9
  } else if (minutesPending > 5) {
    // every 3 blocks if pending more than 5 minutes
    // pending 5分钟 区块距离大于2
    return blocksSinceCheck > 2
  } else {
    // otherwise every block
    // pending 小于5分钟的所有记录
    return true
  }
}
```

## PoolList

追踪用户的Pool信息

### useTrackedTokenPairs

返回用户关心token的相关Pool列表

```ts
// src/state/user/hooks.tsx

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  // 所有处于激活状态的token (界面中的token列表)
  const tokens = useAllTokens()

  // pinned pairs
  // 获取置顶的交易对
  // 只有主网有置顶交易对 ： [cDAI, cUSDC], [USDC, USDT], [DAI, USDT]
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  // pairs for every token against every base
  // 根据base token 和所有token配对
  // BASES_TO_TRACK_LIQUIDITY_FOR
  //    WETH
  //    主网：WETH, DAI, USDC, USDT, WBTC
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), tokenAddress => {
            const token = tokens[tokenAddress]
            // for each token on the current chain,
            // 遍历当前链上的 token
            return (
              // loop though all bases on the current chain
              // 循环遍历当前链上的所有基础 token
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
                // to construct pairs of the given token with each base
                // 通过基础 token 和给定的 token 构建交易对
                .map(base => {
                  if (base.address === token.address) {
                    return null
                  } else {
                    return [base, token]
                  }
                })
                .filter((p): p is [Token, Token] => p !== null)
            )
          })
        : [],
    [tokens, chainId]
  )

  // pairs saved by users
  // 从user state 中取出用户自定义的pair
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  // 自定义pair匹配当前网络
  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(pairId => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  // 拼接遍历的列表 基于basetoken的交易对 + 置顶的交易对 + 用户自定义的pair
  const combinedList = useMemo(() => userPairs.concat(generatedPairs).concat(pinnedPairs), [
    generatedPairs,
    pinnedPairs,
    userPairs
  ])

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    // 最后对列表进行去重 统一将token地址升序排列
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})
    console.log(Object.keys(keyed).map(key => keyed[key]))

    return Object.keys(keyed).map(key => keyed[key])
  }, [combinedList])
}

```

## AddLiquidity

添加流动性/创建流动性池子

### MintReducer

更新Mint state的方法

```ts
// src/state/mint/reducer.ts
export default createReducer<MintState>(initialState, builder =>
  builder
    // 重置Mint state
    .addCase(resetMintState, () => initialState)
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      // noLiquidity 为true代表创建新池子
      // 创建新的池子不需要自动计算另一边的数量，不用清空另一个输入框
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        // 记录用户最近操作的输入框类型以及输入的值
        if (field === state.independentField) {
          return {
            ...state,
            independentField: field,
            typedValue
          }
        }
        // they're typing into a new field, store the other value
        // 如果用户操作了一个新的输入框, 将之前输入的值另外保存备份
        else {
          return {
            ...state,
            independentField: field,
            typedValue,
            otherTypedValue: state.typedValue
          }
        }
      } else {
        // 向已有池子添加流动性，另一个输入框需要自动计算数量，所以需要清空
        return {
          ...state,
          independentField: field,
          typedValue,
          otherTypedValue: ''
        }
      }
    })
)
```

### useDerivedMintInfo

根据用户的输入数据，返回预估添加流动性的数据：

- dependentField 自动计算另一侧需要的token数量
- currencies 两个token对象
- pair 流动性池子对象
- pairState 池子状态
- currencyBalances 用户在两个token上的余额
- parsedAmounts 解析后的数量数值
- price 当前交易价格
- noLiquidity 池子是否流动性为0
- liquidityMinted 预计用户能得到的流动性数量
- poolTokenPercentage 预计本次添加占总流动性的百分比
- error 报错信息

```ts
// src/state/mint/hooks.ts
export function useDerivedMintInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  dependentField: Field
  currencies: { [field in Field]?: Currency }
  pair?: Pair | null
  pairState: PairState
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  price?: Price
  noLiquidity?: boolean
  liquidityMinted?: TokenAmount
  poolTokenPercentage?: Percent
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  // 从 Mint state 获取用户的输入数据
  // independentField 代表用户最新键入的输入框 tokenA/tokenB
  const { independentField, typedValue, otherTypedValue } = useMintState()

  // dependentField 依赖用户输入数值来计算的输入框 tokenA/tokenB
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  // pair
  // 调用 @uniswap/sdk/Pair 来获取池子的对象
  const [pairState, pair] = usePair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  // 将池子合约作为ERC20 token 来查询totalSupply
  const totalSupply = useTotalSupply(pair?.liquidityToken)

  // 池子流动性是否为0 池子不存在或流动性为0
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS || Boolean(totalSupply && JSBI.equal(totalSupply.raw, ZERO))

  // balances
  // 获取当前选中的token的用户余额
  const balances = useCurrencyBalances(account ?? undefined, [
    currencies[Field.CURRENCY_A],
    currencies[Field.CURRENCY_B]
  ])
  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1]
  }

  // amounts
  // 用户键入的数量
  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])
  // 自动计算另一侧数量
  const dependentAmount: CurrencyAmount | undefined = useMemo(() => {
    if (noLiquidity) {
      // 当前池子不存在或流动性为0 不需要自动计算，由用户手动输入
      if (otherTypedValue && currencies[dependentField]) {
        return tryParseAmount(otherTypedValue, currencies[dependentField])
      }
      return undefined
    } else if (independentAmount) {
      // we wrap the currencies just to get the price in terms of the other token
      // 这里会用 @uniswap/v2-sdk/TokenAmount 类型包装输入数值
      const wrappedIndependentAmount = wrappedCurrencyAmount(independentAmount, chainId)
      const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
      if (tokenA && tokenB && wrappedIndependentAmount && pair) {
        // 判断需要计算的是tokenA还是tokenB
        const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
        // 调用sdk计算数值
        // pair是 @uniswap/v2-sdk/Pair 类型
        // sdk会本地计算 price * independentAmount
        const dependentTokenAmount =
          dependentField === Field.CURRENCY_B
            ? pair.priceOf(tokenA).quote(wrappedIndependentAmount)
            : pair.priceOf(tokenB).quote(wrappedIndependentAmount)
        return dependentCurrency === ETHER ? CurrencyAmount.ether(dependentTokenAmount.raw) : dependentTokenAmount
      }
      return undefined
    } else {
      return undefined
    }
  }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, currencyA, chainId, currencyB, pair])
  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
    [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount
  }

  // 计算当前池子的价格
  const price = useMemo(() => {
    // 没有流动性按照用户输入的比例作为价格
    if (noLiquidity) {
      const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
      if (currencyAAmount && currencyBAmount) {
        return new Price(currencyAAmount.currency, currencyBAmount.currency, currencyAAmount.raw, currencyBAmount.raw)
      }
      return undefined
    } else {
      // 已有流动性则调用sdk
      // @uniswap/v2-sdk/Pair.priceOf()
      const wrappedCurrencyA = wrappedCurrency(currencyA, chainId)
      return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined
    }
  }, [chainId, currencyA, noLiquidity, pair, parsedAmounts])

  // liquidity minted
  // 预估用户可以得到的流动性数量
  const liquidityMinted = useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
    const [tokenAmountA, tokenAmountB] = [
      wrappedCurrencyAmount(currencyAAmount, chainId),
      wrappedCurrencyAmount(currencyBAmount, chainId)
    ]
    if (pair && totalSupply && tokenAmountA && tokenAmountB) {
      // @uniswap/v2-sdk/Pair.getLiquidityMinted()
      // 本地计算用户预计能够得到的流动性数量
      // 将两种token数量分别带入公式计算，取最小值
      // tokenAmount / totalAmount * totalLiquidity
      // 如果是新建池子则 tokenAmountA * tokenAmountB - MINIMUM_LIQUIDITY
      return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB)
    } else {
      return undefined
    }
  }, [parsedAmounts, chainId, pair, totalSupply])

  // 预估本地添加占池子总流动性的百分比
  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
    } else {
      return undefined
    }
  }, [liquidityMinted, totalSupply])

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (pairState === PairState.INVALID) {
    error = error ?? 'Invalid pair'
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    error = 'Insufficient ' + currencies[Field.CURRENCY_A]?.symbol + ' balance'
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    error = 'Insufficient ' + currencies[Field.CURRENCY_B]?.symbol + ' balance'
  }

  return {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  }
}
```

### onAdd

确认添加流动性，先预执行再真实发送交易

```ts
// src/pages/AddLiquidity/index.tsx
async function onAdd() {
  if (!chainId || !library || !account) return
  // 获取一个router合约对象 IUniswapV2Router02ABI
  const router = getRouterContract(chainId, library, account)

  // 检查数量
  const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
  if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
    return
  }

  // 根据滑点百分比计算最小添加的数量
  const amountsMin = {
    [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
    [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
  }

  let estimate,
    method: (...args: any) => Promise<TransactionResponse>,
    args: Array<string | string[] | number>,
    value: BigNumber | null
  if (currencyA === ETHER || currencyB === ETHER) {
    // 当其中一种token是ETH 调用router合约的 addLiquidityETH
    const tokenBIsETH = currencyB === ETHER
    estimate = router.estimateGas.addLiquidityETH
    method = router.addLiquidityETH
    // 根据ETH的位置调整入参
    args = [
      wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
      (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // 期望的 token 数量
      amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // 最少的 token 获取数
      amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // 最少的 eth 数量
      account,
      deadline.toHexString()
    ]
    // ETH 发送的数量
    value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
  } else {
    // 没有ETH 调用router合约的 addLiquidity
    estimate = router.estimateGas.addLiquidity
    method = router.addLiquidity
    args = [
      wrappedCurrency(currencyA, chainId)?.address ?? '',
      wrappedCurrency(currencyB, chainId)?.address ?? '',
      parsedAmountA.raw.toString(),
      parsedAmountB.raw.toString(),
      amountsMin[Field.CURRENCY_A].toString(),
      amountsMin[Field.CURRENCY_B].toString(),
      account,
      deadline.toHexString()
    ]
    // 不用发送ETH
    value = null
  }

  // 打开交易执行中的提示弹窗
  setAttemptingTxn(true)
  // 交易预执行
  await estimate(...args, value ? { value } : {})
    .then(estimatedGasLimit =>
      // 返回真实发送交易的方法
      method(...args, {
        ...(value ? { value } : {}),  // 若有ETH放在这里
        gasLimit: calculateGasMargin(estimatedGasLimit) //  根据预执行预估的gas费用上浮10%
      }).then(response => {
        // 发送交易成功后关闭提示弹窗
        setAttemptingTxn(false)

        // 将交易记录推入 Transaction state
        addTransaction(response, {
          summary:
            'Add ' +
            parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
            ' ' +
            currencies[Field.CURRENCY_A]?.symbol +
            ' and ' +
            parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
            ' ' +
            currencies[Field.CURRENCY_B]?.symbol
        })

        // 保存交易哈希值
        setTxHash(response.hash)

        // 谷歌分析的插件
        ReactGA.event({
          category: 'Liquidity',
          action: 'Add',
          label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/')
        })
      })
    )
    .catch(error => {
      setAttemptingTxn(false)
      // we only care if the error is something _other_ than the user rejected the tx
      // 交易发生错误,忽略错误码4001的情况
      // 4001 代表用户在钱包确认阶段拒绝了交易
      if (error?.code !== 4001) {
        console.error(error)
      }
    })
}
```

## RemoveLiquidity

### useDerivedBurnInfo

根据用户输入，返回预估移除流动性的数据

- pair 池子对象，@uniswap/v2-sdk/Pair 类型
- parsedAmounts 计算后的移除流动性数据，用于发起移除交易
- error 报错信息

```ts
// src/state/burn/hooks.ts
export function useDerivedBurnInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  pair?: Pair | null
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: CurrencyAmount
    [Field.CURRENCY_B]?: CurrencyAmount
  }
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  // 拿到用户的输入数值，independentField 输入的在哪一边 typedValue 销毁流动性数量的百分比
  const { independentField, typedValue } = useBurnState()

  // pair + totalsupply
  // 调用 @uniswap/sdk/Pair 来获取池子的对象
  const [, pair] = usePair(currencyA, currencyB)

  // balances
  // 查询用户的流动性数量 pair.balanceOf
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pair?.liquidityToken])
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
  const tokens = {
    [Field.CURRENCY_A]: tokenA,
    [Field.CURRENCY_B]: tokenB,
    [Field.LIQUIDITY]: pair?.liquidityToken
  }

  // liquidity values
  // 查询pair的总流动性数量 pair.totalSupply()
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  // 估算用户在池子内两个token的总量
  // @uniswap/v2-sdk/Pair.getLiquidityValue
  // tokenAmount = liquidit / liquidityTotal * reserve
  const liquidityValueA =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenA &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    // 这个条件判断是一个逻辑短路, 以防用户在当前交易对下的流动性数量的更新早于交易对的总流动性数量更新 
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValueB =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenB &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    // 这个条件判断是一个逻辑短路, 以防用户在当前交易对下的流动性数量的更新早于交易对的总流动性数量更新
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValues: { [Field.CURRENCY_A]?: TokenAmount; [Field.CURRENCY_B]?: TokenAmount } = {
    [Field.CURRENCY_A]: liquidityValueA,
    [Field.CURRENCY_B]: liquidityValueB
  }

  // 计算要移除的百分比
  let percentToRemove: Percent = new Percent('0', '100')
  // user specified a %
  // simple模式，用户直接托滑块选择百分比
  if (independentField === Field.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValue, '100')
  }
  // user specified a specific amount of liquidity tokens
  // detail模式，用户输入要移除的liquidity数量，换算成百分比
  else if (independentField === Field.LIQUIDITY) {
    if (pair?.liquidityToken) {
      const independentAmount = tryParseAmount(typedValue, pair.liquidityToken)
      // 移除的流动性不能大于用户的总流动性
      if (independentAmount && userLiquidity && !independentAmount.greaterThan(userLiquidity)) {
        // 移除百分比 = 移除流动性 / 用户总流动性
        percentToRemove = new Percent(independentAmount.raw, userLiquidity.raw)
      }
    }
  }
  // user specified a specific amount of token a or b
  // detail模式，用户输入要移除的token数量(tokenA/tokenB)，换算成百分比
  else {
    if (tokens[independentField]) {
      const independentAmount = tryParseAmount(typedValue, tokens[independentField])
      const liquidityValue = liquidityValues[independentField]
      // 移除的token数量不能大于池子内用户的token总数
      if (independentAmount && liquidityValue && !independentAmount.greaterThan(liquidityValue)) {
        // 移除百分比 = 移除的token数量 / 池子内用户的token总数
        percentToRemove = new Percent(independentAmount.raw, liquidityValue.raw)
      }
    }
  }

  // 组装数据
  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]:
      userLiquidity && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(userLiquidity.token, percentToRemove.multiply(userLiquidity.raw).quotient)
        : undefined,
    [Field.CURRENCY_A]:
      tokenA && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueA
        ? new TokenAmount(tokenA, percentToRemove.multiply(liquidityValueA.raw).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      tokenB && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueB
        ? new TokenAmount(tokenB, percentToRemove.multiply(liquidityValueB.raw).quotient)
        : undefined
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  return { pair, parsedAmounts, error }
}
```

### onAttemptToApprove

根据用户移除的输入数值，计算签名消息并调用钱包签名方法，获得v,r,s 和 deadline一起存入 setSignatureData 字段

```ts
// src/pages/RemoveLiquidity/index.tsx
async function onAttemptToApprove() {
  if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
  const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
  if (!liquidityAmount) throw new Error('missing liquidity amount')

  // 如果是ArgentWallet 直接返回pair合约的approve方法
  if (isArgentWallet) {
    return approveCallback()
  }

  // try to gather a signature for permission
  // 尝试生成一个授权签名
  // 获取用户在pair合约中的nonce值
  const nonce = await pairContract.nonces(account)

  // 一些签名用的参数
  const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ]
  const domain = {
    name: 'Uniswap V2',
    version: '1',
    chainId: chainId,
    verifyingContract: pair.liquidityToken.address
  }
  const Permit = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
  // 组装被签名的消息，其中包括要移除的流动性数量，所以当数值变化需要重新生成签名参数
  const message = {
    owner: account,
    spender: ROUTER_ADDRESS,
    value: liquidityAmount.raw.toString(),
    nonce: nonce.toHexString(),
    deadline: deadline.toNumber()
  }
  const data = JSON.stringify({
    types: {
      EIP712Domain,
      Permit
    },
    domain,
    primaryType: 'Permit',
    message
  })

  // 调用provider的签名方法获得 v,r,s 和 deadline一起存入 setSignatureData 字段
  library
    .send('eth_signTypedData_v4', [account, data])
    .then(splitSignature)
    .then(signature => {
      setSignatureData({
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline: deadline.toNumber()
      })
    })
    .catch(error => {
      // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
      // 忽略用户拒绝签名的情况
      if (error?.code !== 4001) {
        approveCallback()
      }
    })
}

```

### onRemove

发送移除流动性交易的方法

```ts
async function onRemove() {
  if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
  const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
  if (!currencyAmountA || !currencyAmountB) {
    throw new Error('missing currency amounts')
  }

  // 拿到Router合约对象
  const router = getRouterContract(chainId, library, account)

  // 根据滑点百分比计算最少需要移除的流动性数量 - 针对token的数量
  const amountsMin = {
    [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
    [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0]
  }

  // 判断token是否已经全部设置
  if (!currencyA || !currencyB) throw new Error('missing tokens')
  const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
  // 判断流动性是否已经填写
  if (!liquidityAmount) throw new Error('missing liquidity amount')

  // 判断交易对是否有ETH
  const currencyBIsETH = currencyB === ETHER
  const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH

  if (!tokenA || !tokenB) throw new Error('could not wrap')

  // 有ETH调用router合约的 removeLiquidityETH 方法，没有则调用 removeLiquidity
  let methodNames: string[], args: Array<string | string[] | number | boolean>
  // we have approval, use normal remove liquidity
  // 如果pair合约已经授权给router，直接调用普通的remove方法
  if (approval === ApprovalState.APPROVED) {
    // removeLiquidityETH
    if (oneCurrencyIsETH) {
      // 同时尝试两种方法，优先执行第一个
      methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
      args = [
        currencyBIsETH ? tokenA.address : tokenB.address,
        liquidityAmount.raw.toString(),
        amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
        amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
        account,
        deadline.toHexString()
      ]
    }
    // removeLiquidity
    else {
      methodNames = ['removeLiquidity']
      args = [
        tokenA.address,
        tokenB.address,
        liquidityAmount.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString()
      ]
    }
  }
  // we have a signataure, use permit versions of remove liquidity
  // 没有授权，使用签名移除流动性的方法
  else if (signatureData !== null) {
    // removeLiquidityETHWithPermit
    if (oneCurrencyIsETH) {
      // ...SupportingFeeOnTransferTokens 是可以让router不验证token返回数量的方法
      methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
      args = [
        currencyBIsETH ? tokenA.address : tokenB.address,
        liquidityAmount.raw.toString(),
        amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
        amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
        account,
        signatureData.deadline,
        false,
        signatureData.v,
        signatureData.r,
        signatureData.s
      ]
    }
    // removeLiquidityETHWithPermit
    else {
      methodNames = ['removeLiquidityWithPermit']
      args = [
        tokenA.address,
        tokenB.address,
        liquidityAmount.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        signatureData.deadline,
        false,
        signatureData.v,
        signatureData.r,
        signatureData.s
      ]
    }
  } else {
    throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
  }

  // 预执行所有交易
  const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
    methodNames.map(methodName =>
      router.estimateGas[methodName](...args)
        .then(calculateGasMargin)
        .catch(error => {
          console.error(`estimateGas failed`, methodName, args, error)
          return undefined
        })
    )
  )

  // 找出第一条执行成功的索引
  const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
    BigNumber.isBigNumber(safeGasEstimate)
  )

  // all estimations failed...
  if (indexOfSuccessfulEstimation === -1) {
    // 如果所有预执行都失败, 输出报错
    console.error('This transaction would fail. Please contact support.')
  } else {
    // 执行优先级高的成功的方法
    const methodName = methodNames[indexOfSuccessfulEstimation]
    const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

    // 打开交易进行中的提示窗
    setAttemptingTxn(true)
    // 调用router的移除方法
    await router[methodName](...args, {
      gasLimit: safeGasEstimate
    })
      .then((response: TransactionResponse) => {
        // 执行成功关闭提示弹窗
        setAttemptingTxn(false)

        // 向Transaction state推送交易记录
        addTransaction(response, {
          summary:
            'Remove ' +
            parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
            ' ' +
            currencyA?.symbol +
            ' and ' +
            parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
            ' ' +
            currencyB?.symbol
        })

        setTxHash(response.hash)

        ReactGA.event({
          category: 'Liquidity',
          action: 'Remove',
          label: [currencyA?.symbol, currencyB?.symbol].join('/')
        })
      })
      .catch((error: Error) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        // 这里我们只关心具体错误, 而非是否是用户拒绝了交易
        console.error(error)
      })
  }
}
```
