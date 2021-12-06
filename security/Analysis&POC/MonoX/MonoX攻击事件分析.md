### 攻击交易

```
0x9f14d093a2349de08f02fc0fb018dadb449351d0cdb7d0738ff69cc6fef5f299
```

### 攻击合约

```
0xf079d7911c13369E7fd85607970036D2883aFcfD
```

### 攻击者地址1 负责部署攻击合约 

```
0xEcbE385F78041895c311070F344b55BfAa953258
```

### 攻击者地址2 只负责收钱

```
0x8f6A86f3aB015F4D03DDB13AbB02710e6d7aB31B
```

### 好玩的地址, 受损用户给攻击者转账, 求攻击者还钱

```
0xab5167e8cC36A3a91Fd2d75C6147140cd1837355
```

```
0xe0e38b864bb2e6ababbc7d45dc3eb0b0118607ca1d8ae0dfcd048ae9b37b7b87
```

### 攻击交易分析

1. 向WETH存0.1个ETH

2. 授权给Monoswap的代理合约地址0.1个WETH

3. 用0.1个WETH在Monoswap中换出79.9个Mono

4. 授权给Monoswap的代理合约地址 2**256-1 个Mono

5. 静态调用Monoswap的pools函数, 查询XPool中Mono的信息

6. 静态调用Xpool的totalSupplyOf函数, 查询池子中Mono的总量

7. 静态调用Xpool的balanceOf函数, 查询某个大户(0x7b)在池子中的Mono余额

6. 调用Monoswap的`removeLiquidity`函数, (传入参数为：1. Mono Token的地址 2. 刚才查询到的该大户余额 3.  该大户的地址 4. 数值0  5. 数值1), 越权剔除了该大户在池子中的流动性

7. 同上述操作, 剔除了另外两个大户的流动性

8. 调用Monoswap的`addLiquidity`函数, 用极少量的Mono`196875656/1e18`,给自己添加流动性

9. 静态调用Monoswap的pools函数, 查询此时XPool中Mono的信息, 此时`lastPoolValue`已经发生巨大变化, 而且tokenBalance只剩下了攻击者添加的少量流动性

10. 调用Monoswap的`swapExactTokenForToken`函数, (传入参数为：1. Mono Token的地址 2. Mono Token的地址 3. 刚才添加流动性的数量`196875655`(刚才查询到的数量-1), 4. 数值0 5. 自己的地址 6. 时间戳), 获得了`79706446/1e18`个Mono, 单看这一步是亏的

11. 静态调用Monoswap的pools函数, 查询到此时的tokenBalance为`314044865`

12. 再次调用Monoswap的`swapExactTokenForToken`函数, 同样是用Mono换Mono, 传入的数量为`314044864`(刚才查询到的数量-1)

13. 循环上述操作55次, 此时XPool中Mono的tokenBalance约为28个, 攻击合约的Mono余额为51.9个, 此时需要注意:

* 攻击之前的XPool返回的Mono的信息

```
pid=10, lastPoolValue=531057465205747239605262, token=MONO, status=2, vcashDebt=0, vcashCredit=417969352001142975260, tokenBalance=101764473116983332370454, price=5218495054176274115, createdAt=1637853228
```

* 剔除大户流动性之后XPool返回的Mono的信息

```
pid=10, lastPoolValue=1027394637, token=MONO, status=2, vcashDebt=0, vcashCredit=0, tokenBalance=196875656, price=5218495054176274115, createdAt=1637853228
```

* 循环55次之后XPool返回的Mono的信息

```
pid=10, lastPoolValue=1027394637, token=MONO, status=2, vcashDebt=0, vcashCredit=0, tokenBalance=28065601457649448980, price=843741636512366463585990541128, createdAt=1637853228
```

14. 可以看到此时Mono在XPool中的price由`5218495054176274115`变成了`843741636512366463585990541128`, 变大了`161682942640`倍, 太多倍了, 数不过来,其实此时攻击已经可以收尾, 但是攻击者可能为了避免滑点,使利益最大化, 还进行了下面的操作

15. 静态调用Monoswap的pools函数, 但是这次查询的是XPool中PID=2, 也就是`USDC`的信息, 为下一步攻击做准备

16. 调用`UniSwap V2`中`USDC/ETH`交易对的闪电贷功能,借出约`845`个`WETH`

17. 在回调函数中, 攻击合约用`0.07`个Mono在`MonoSwap`中换了约`4029106`个USDC,并把换出来的所有USDC还给`UniSwap V2`中`USDC/ETH`交易对, 也许这样可以避免滑点？

18. 同上, 攻击合约对池子里的`USDT`,`WETH`,`WBTC`,`DUCK`,`MIM`,`IMX`进行了同样的操作. 

19. 攻击流程结束
