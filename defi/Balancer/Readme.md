# Balancer Share
## Balancer 核心公式及推导
balancer创建一个指数池子，这个池子中存在多种token，每一种token有一个自定义的weight，类似于Uniswap，balancer中的所有token的交换满足如下公式：
$$
V = \prod_t B_t^{W_t}
$$
其中，V是一个常量，$B_t$是第t种token在池子中的balance。$w_t$是该中token的normalized weitght。$w_t$的定义如下：
$$
W_t = \frac{w_i}{\sum w_i}
$$
其中，每一种token的$w_i$由创建该池子的管理员定义。一般情况下的swap，add/remove liquidity不会影响到token的权重。  
这让balancer非常适合用作指数。

## SPOT price
在不考虑手续费的条件下，balancer里面，两种token兑换的spot price定义如下：
$$
SP_i^o=\frac{B_i/w_i}{B_o/w_o}
$$
其中，$B_i$是token_i的balance；$B_o$是token_o的balance。$w_i$ 是token_i的权重，$w_o$是token_o的权重；  
#### 证明过程：
首先定义effective price，即实际交换的price：
$$
EP_t^o=A_i/A_o
$$
则，SPOT price为：
$$
SP_t^o  =\displaystyle{\lim_{A_0,A_i \to 0}}EP_t^o
        =\displaystyle{\lim_{A_0,A_i \to 0}} \frac{A_i}{A_o}
        =\displaystyle{\lim_{\Delta B_0,\Delta B_i \to 0}} \frac{\Delta B_i}{-\Delta B_o}
$$
且：
$$
B_i^{W_i}=\frac{V}{B_o^{W_o} \cdot \prod_{k \neq i,o}B_k^{W_k}}
$$
则：
$$
B_i=\left(\frac{V}{B_o^{W_o} \cdot \prod_{k \neq i,o}B_k^{W_k}}\right)^{1/{W_i}}
$$
即：
$$
SP_t^o  = \frac{\delta B_i}{-\delta B_o} = \frac{\delta}{-\delta B_o} \left( \left(\frac{V}{B_o^{W_o} \cdot \prod_{k \neq i,o}B_k^{W_k}}\right)^{1/{W_i}}\right) = ... = \frac{B_i/w_i}{B_o/w_o}
$$


## TVL
在balancer里面，衡量一个池子的TVL可以用如下公式来计算：
$$
V^t = B_t + \sum_{k\neq t} V_{k}^t
$$
公式的算法含义是：选择该池的一个token，如USDC，作为计价token。则该池子的TVL可以认为是USDC的数量与该池子的其他token在池子理论上兑换的USDC的数量之和。  
$$
V_k^t = B_n / SP_n^t = B_n \cdot \frac{B_t / W_t}{B_n / W_n} = B_t \cdot \frac{W_n}{W_t}
$$
则，TVL可以化简为：
$$
V^t = B_t + \frac{B_t}{W_t} \sum_{k \neq t} W_n = \frac{B_t}{W_t}
$$
**这种TVL的计算方式导致TVL只跟$B_t$相关,$W_t$是一个常量，容易被操控。**
**Index Finance的Hack里的一个关键点就在于这种TVL的计算机制**
这里的TVL计算方式，跟Uni里面对于LP的错误定价方式的错误是一样的。TVL的计算不能够使用池子里的balance来计算，否则都容易被操纵。

## SWAP
在不考虑手续费的情况下，SWAP时，V保持不变；可以利用V不变的性质来计算应该swap出的token数量。开考虑手续费的情况下，计算SWAP时，把手续费扣在input token上，然后再按照不要手续费的情况来考虑计算。
### Out-Given-In
不考虑手续费：
$$
A_o = B_o \cdot \left(1 - \left(\frac{B_i}{B_i + A_i} \right)^{W_i/W_o} \right)
$$
考虑手续费：swap fee => SF => 百分比
$$
A_o = B_o \cdot \left(1 - \left(\frac{B_i}{B_i + A_i \cdot (1 - SF)} \right)^{W_i/W_o} \right)
$$

### In-Given-Out
不考虑手续费：
$$
A_i = B_i \cdot \left((\frac{B_o}{B_o - A_o})^{W_o/W_i} - 1\right)
$$
考虑手续费：
$$
A_i = B_i \cdot \left((\frac{B_o}{B_o - A_o})^{W_o/W_i} - 1\right) / (1 - SF)
$$

## Add/Remove LP
### 等比例的添加token,不导致SPOT price移动，其比例应该是：
$$
(B_i/W_i):(B_j/W_j):(B_k/W_k)
$$
如果等比例的添加token，则也会等比例的mint出LP；
但是在**代码实现中**，该比例并不是保证SPOT price不变的比例，而是：
$$
B_i :B_j:B_k
$$
即，当JOIN POOL之后，SPOT price会发生移动。
具体实现如下：
```js
function joinPool(uint poolAmountOut, uint[] calldata maxAmountsIn)
        external
    {
        uint poolTotal = totalSupply();
        uint ratio = bdiv(poolAmountOut, poolTotal);

        for (uint i = 0; i < _tokens.length; i++) {
            address t = _tokens[i];
            uint bal = _records[t].balance; //比例是records.balance, 而非 balance/ weight
            uint tokenAmountIn = bmul(ratio, bal);
            _records[t].balance = badd(_records[t].balance, tokenAmountIn);
            _pullUnderlying(t, msg.sender, tokenAmountIn);
        }
        _mintPoolShare(poolAmountOut);
        _pushPoolShare(msg.sender, poolAmountOut);
    }
```
### 单币添加或者不均匀添加,会导致价格移动:
### Single Asset Deposit: 
1. borrow B, C
2. deposit A + B + C (equally)
3. swap A for B 
4. swap A for C
5. repay B, C 


LP的数量应该与池子里的不变量V成正比，即：
$$
    \frac{V`}{V} = \frac{LP`}{LP}
$$
### Pool Out Given Single In
如果不考虑手续费：
则公式如下：
$$
P_{issued} = P_{supply}\cdot \left((1+\frac{A_t}{B_t})^{W_t} - 1\right)
$$


如果考虑手续费：
$$
P_{issued} = P_{supply}\cdot \left((1 + \frac{A_t \cdot (1 - (1 - W_t) \cdot SF))}{B_t})^{W_t} - 1\right)
$$

证明过程如下：
$$
\frac{V`}{V} = \frac{\prod_k(B`_k)^{W_k}}{\prod_k(B_k)^{W_k}}
             = \frac{(B`_k)^{W_t}}{(B`_k)^{W_t}}
             = (\frac{B`_k}{B_k})^{W_t}
             = ({\frac{B_k + A_k}{B_k}})^{W_t}
$$
$$
\frac{LP`}{LP} = \frac{P_{supply} + P_{issue}}{P_{supply}}
$$
对于PoolOutGivenSingleIn，就是已知$A_t$,求$P_{issued}$
对于SingleInGivenPoolOut，就是已知$P_{issued}$，求$A_t$
### Single Asset Withdraw: 等价于：
1. withdrap lp eaqually, get A, B, C
2. swap B for A
3. swap C for A

### Single Out Given Pool In
不考虑手续费：
公式如下：
$$
A_t = B_t \cdot \left(1 - (1 - \frac{P_{redeemed}}{P_{supply}})^{\frac{1}{W_t}} \right)
$$
考虑手续费：
$$
A_t = B_t \cdot \left(1 - (1 - \frac{P_{redeemed} \cdot (1 - EF)}{P_{supply}})^{\frac{1}{W_t}} \right) \cdot (1 - (1 - W_t)SF)
$$
其中，SF是swap fee， EF是exit pool fee

证明过程如下：
$$
    \frac{V`}{V} = \frac{LP`}{LP}
$$
$$
\frac{V`}{V} = \frac{\prod_k(B`_k)^{W_k}}{\prod_k(B_k)^{W_k}}
             = \frac{(B`_k)^{W_t}}{(B`_k)^{W_t}}
             = (\frac{B`_k}{B_k})^{W_t}
             = ({\frac{B_k - A_k}{B_k}})^{W_t}
$$
$$
\frac{LP`}{LP} = \frac{P_{supply} - P_{redeemed}}{P_{supply}}
$$
对于SingleOutGivenPoolIn,就是已知$P_{redeemd}$求未知的$A_k$
对于PoolInGivenSingleOut， 就是已知$A_k$,求$P_{redeemd}$

# 基于Balancer上的上层应用：Indexed Finance 指数基金
https://legacy.indexed.finance/index/DEFI5
https://legacy.indexed.finance/categories

# WhitePaper
https://balancer.fi/whitepaper.pdf