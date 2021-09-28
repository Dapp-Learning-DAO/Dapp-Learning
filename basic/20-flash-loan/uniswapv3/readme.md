## UniswapV3 Flashswap

UniswapV3版本中,同样提供了flashswap的闪电贷功能。即可以向一个交易对借贷 x token，但在还贷时使用 y token.

falsh swap 的实现原理是:

1. 借贷方可以先向合约借贷 x, y token 中某一个（或者两个都借贷）
2. 借贷方指定借贷的数量，以及回调函数的参数，调用 flashswap
3. 合约会先将用户请求借贷的 token 按指定数量发送给借贷方
4. 发送完毕后，Uniswap Pair 合约会向借贷方指定的合约的地址调用指定的回调函数，并将回调函数的参数传入
5. 调用完成后，Uniswap Pair 合约检查 x, y token 余额满足 $$ x′⋅y′≥k $$

在flashswap中, 用户可以不需要预先支付token就可以得到想要的token, 这部分需要支付的token只需要在回调函数中转回给合约即可. 在flashswap完成后AMM池中的价格会发生改变. flashswap可以用来进行AMM之间套利，借贷平台清算等操作.

flashswap 类似于一个功能更强的闪电贷,一个接口即可完成借贷和交易的操作. 关于flashswap的更多内容,可以参考 [官方文档](https://docs.uniswap.org/protocol/guides/flash-integrations/inheritance-constructors).


