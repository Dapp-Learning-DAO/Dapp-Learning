# Code代码解析

## Swap

### useDerivedSwapInfo


从用户的输入数值来计算最佳的交易路径

```js
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

  // 计算考虑滑点的情况下的输入 v2
  const slippageAdjustedAmounts = v2Trade && allowedSlippage && computeSlippageAdjustedAmounts(v2Trade, allowedSlippage)

  // 计算考虑滑点的情况下的输入 v1
  const slippageAdjustedAmountsV1 =
    v1Trade && allowedSlippage && computeSlippageAdjustedAmounts(v1Trade, allowedSlippage)

  // compare input balance to max input based on version
  // 比较用户的token余额与计算滑点后的输入数量
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

```js
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
        // 这里是比较 bestTradeSoFar * 100.5% < currentTrade
        // 由于i是递增的，所以这里 currentTrade 会比 bestTradeSoFar 长度少
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

```js
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
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
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

给定一组交易对数组，在其中寻找所有可能的交易路径，并进行最优排序，第一个元素为最优的交易路径

- 这是sdk中的方法`@uniswap/sdk/Trade.bestTradeExactOut`
- 该方法主要接受三个参数：交易对数组， 精确的输出数量，递归深度(交易路径的长度)
- 遍历交易对数组，然后对每个交易对进行递归查找，找到头尾符合输入输出的路径会排序并插入到结果中
- 最终返回一个交易路径组成的数组，第一个元素为最优的交易路径

### useSwapCallback

向router合约发起交易，返回交易的 状态，回调，报错

```js
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
    if (!recipient) {
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
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
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

```js
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

```js
// approve 状态
export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED
}
```

```js
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
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  // 生成approve授权方法
  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

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

```js
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

```js
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

```js
// src/state/transactions/updater.tsx
export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()

  const lastBlockNumber = useBlockNumber()

  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const transactions = chainId ? state[chainId] ?? {} : {}

  // 显示交易确认弹窗的方法
  const addPopup = useAddPopup()

  // 利用useEffect机制监听，一旦有依赖参数变化，触发useEffect方法更新交易记录
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
  }, [chainId, library, transactions, lastBlockNumber, dispatch, addPopup])

  return null
}
```

### shouldCheck

判断当前交易记录是否需要监听的方法

```js
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
