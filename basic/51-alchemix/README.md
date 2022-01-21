## 介绍

Alchemix 是一个允许创造合成资产代币 al-token（这些代币表示存款的未来收益）的 DeFi 协议. Alchemix 可以让用户近乎即时取回部分临时质押的稳定币的代币价值, 解决质押资产流动性的问题. 此协议承载了一类强大的新品种 DeFi 原型, 同时提供给用户和开发者无数的应用和全新的工具.

Alchemix 主打具有竞争力的高收益率, 用户可以用从越来越多的高收益策略中进行选择以偿还债务: 并且没有清算风险, 无论发生什么情况, Alchemix 都不会清算用户的存款, 并且用户将拥有完整的访问权限; 低维护成本, 用户提取自己的美元之后允许自己偿还贷款.

PS: 为方便代码测试, 请在 .env 中放入的私钥 和 INFURA_ID，样例文件可参考 .env.example

## 业务逻辑介绍

- 场景 1: 质押资产 && alUSD 合成  
  用户 A 质押了 100 Dai 到 Alchemist 中, 这是用户就可以去合成最多 50 的 alUSD. 同时, Alchemist 会自动把用户质押的资产放到 Yearn 中去赚取收益.

- 场景 2: Yearn 收益分配  
  场景 1 中的用户质押 100 Dai 过了一个月后, Yearn 收益了 10 Dai, 这里以只有用户 A 为例; 如果还有其他用户, 那么收益就会按照份额进行分摊.  
  这里, Alchemist 收益了 10 Dai 后, 会转入 Transmuter 中. 然后在用户的个人信息中增加信用额度值 ( credit += 10 ).  
  正常情况下, 因为用户 A 只质押了 100 Dai , 他只能合成 50 alUSD, 但因为现在用户 A 的 credit 为 10, 那么他总共可以合成 60 alUSD.  
  这里我们可以注意到, Alchemist 没有把 Yearn 产生的收益分配给用户, 而是作为提高合成 alUSD 的额度发放给用户. 现在用户 A 拿着 60 alUSD 除了归还外, 无法产生任何收益, 即不能把 alUSD 转换为 Dai.

- 场景 3: alUSD 质押  
  在场景 2 中, 我们了解到 Yearn 的收益可以增加合成 alUSD 的额度, 那么这个 alUSD 有什么用呢 ？ 继续场景 2 的话题, 假设用户总共合成了 60 的 alUSD, 其中 50 alUSD 是 100 Dai 的额度,
  另外 10 alUSD 是 Yearn 收益产生的额度. 现在用户 A 把这 60 个 alUSD 存入 Transmuter; 注意当用户 A 存入 60 alUSD 的时候, Transmuter 会计算当前 Transmuter 中质押 alUSD 用户的收益.
  用户 A 存入 60 alUSD 的时候, Transmuter 发现从 Yearn 收入 10 Dai 的收益到用户 A 存入 60 alUSD 这段时间内, Transmuter 中没有用户质押 alUSD, 那么从 Yearn 收益的 10 Dai 不会分配给任何用户.

- 场景 4: alUSD 转换  
  用户 A 在 Transmuter 中存入了 60 alUSD 后过了一个月时间, Yearn 又产生了 80 Dai 的收益. 当 Yearn 把这 80 Dai 的收益存入 Transmuter 的时候, 发现 Transmuter 中质押了 60 alUSD, 那么每一份 alUSD 可以获得 profit = 80 / 60 = 1.33 , 那么用户 A 所获的的收益是 1.33 \* 60 = 80 > 60 , 此时 Transmuter 会把用户 A 的收益设置为 60, 等同于用户质押的 alUSD 数量. 然后记录用户 A 可转换的 alUSD 数量为 60, 即 transferAmount = 60. 此时用户 A 才可以用 alUSD 去兑换 Dai , 可兑换的最大数量为 60

## 主要合约及函数功能说明

### Alchemist.sol 合约

主逻辑合约, 也是用户交互的主合约. 用户存入稳当代币到这个合约后, 可以进行后续的操作.

- constructor(IMintableERC20 \_token, IMintableERC20 \_xtoken,address \_governance, address \_sentinel)

  - \_token 为用户存入的资产 Token , 比如 daiToken
  - \_xtoken 为生成合成资产的 Token 地址, 这里对应为 alUSD
  - \_governance 为 dao 治理合约地址
  - \_sentinel 哨兵地址, 拥有在必要的时候打开紧急开关的权限

- deposit  
  用户存入资产时调用的接口. 具体对应的场景为, 比如用户存入 100 daiToken, Alchemix 使用用户存入的这 100 daiToken 去创造收益后, 之后把对应的收益分给用户

- withdraw  
  提取之前存入的资产. 比如用户先调用了 deposit 存入 100 daiToken, 之后调用 withdraw 取回存入的 100 daiToken.

- mint  
  生成 Alchemist 的合成资产 alUSD. 这里 alUSD 和用户存入的资产价值是 1:1 的关系, 但用户最多只能生成 1/2 价值的存入资产.
  比如用户存入了 100 daiToken, 调用这个接口后, 最多可以生成 50 alUSD. 之后无论何时用户都可以使用这 50 alUSD 换取 50 daiToken.

- repay(uint256 \_parentAmount, uint256 \_childAmount)  
  用户偿还负债的接口. 用户如果调用 deposit 接口, 是不会产生负债的. 但是当用户调用了 mint 接口生成 alUSD 后, 就会产生负债. 比如用户 deposit 100 daiToken, 然后
  调用 mint 接口生成 50 alUSD, 那么用户就用户 50 alUSD 的负债. 当用户想取回存入的 100 daiToken 时, 需要先偿还 alUSD, 这里既可以使用 alUSD 偿还, 也可以使用用户
  存入的资产 daiToken 进行偿还. - \_parentAmount: 用户使用原始资产进行负债偿还的数量  
   - \_childAmount: 用户使用 alUSD 进行负债偿还的数量

- liquidate  
  使用抵押品进行负债偿还. 这个接口和 repay 功能类似, 也是用于偿还债务的, 不过这里它进行偿还时, 是使用的抵押品进行偿还的.
  比如, 用户调用存入 100 daiToken, 然后生成 20 alUSD. 当用户调用 liquidate 接口, 传入参数为 20 时, Alchemist 会在该用户的负债中减去 20 ( 用户负债变为 0 , 但该用户依然持有 20 alUSD ).
  然后再把用户的总存入资产减去 20 ( 变为 80 daiToken ), 然后把这 20 daiToken 转入 Transmuter 合约中 ( 后面会介绍 Transmuter 合约作用 ).

- harvest  
  收获收益. 用户存入资产到 Alchemist 后, Alchemist 会把这些资产使用 Yearn 去赚取收益, 然后再把相应的收益进行分摊. 比如, 所有用户总共存入 100 daiToken, 调用 harvest 接口后, 发现截止当前, Yearn 产生的总收益为 30 daiToken, 那么这 30 daiToken 会转入 Transmuter 中, 同时 Yearn 总的收益累积为 "currentAccumulatedYieldWeight = lastAccumulatedYieldWeight + 0.3";

- 用户收益计算  
  用户存入资产到 Alchemist 的时候, Alchemist 会给每个用户记录一个用户信息 ( 使用 \_cpd 表示 ), 保留用户总的资产存入值, 负债值等信息, 同时 Alchemist 会记录 Alchemist 总的收益累积 ( 使用 \_ctx 表示).
  比如用户 A 存入 100 daiToken, 对应 \_cpd_A.lastAccumulatedYieldWeight 值为 0 , 用户 B 存入 20 daiToken, 对应 \_cpd_B.lastAccumulatedYieldWeight 值为 0 . 1 个月后, Alchemist 产生收益为 24 daiToken, 此时  
  \_ctx.accumulatedYieldWeight = 24 / （100 + 20 ) = 0.2;  
  当用户 A 触发 deposit 或是 withdraw 时, 计算得到  
   \_cpd_A.totalCredit  
  = (\_ctx.accumulatedYieldWeight - \_cpd_A.lastAccumulatedYieldWeight) _ \_cpd_A.totalDeposited
  = (0.2 - 0) _ 100  
  = 20

更新 \_cpd_A.lastAccumulatedYieldWeight = \_ctx.accumulatedYieldWeight.

同理, 用户 B 计算收益得到  
 \_cpd_B.totalCredit  
= (\_ctx.accumulatedYieldWeight - \_cpd_B.lastAccumulatedYieldWeight) _ \_cpd_B.totalDeposited
= (0.2 - 0) _ 20  
= 4

更新 \_cpd_B.lastAccumulatedYieldWeight = \_ctx.accumulatedYieldWeight  
之后, \_cpd_B.totalCredit ( 或是 \_cpd_A.totalCredit ) 可以用于用户的 mint

```shell
## 用户信息结构体
struct Data {
    uint256 totalDeposited;
    uint256 totalDebt;
    uint256 totalCredit;
    uint256 lastDeposit;
    FixedPointMath.FixedDecimal lastAccumulatedYieldWeight;
  }

## 总收益
struct Context {
    FixedPointMath.FixedDecimal collateralizationLimit;
    FixedPointMath.FixedDecimal accumulatedYieldWeight;
  }
```

### Transmuter.sol 合约

- distribute  
  这个接口由 Alchemist 合约调用, 用于向 Transmuter 合约中存入代币.  
  例如, 当用户清算了 50 daiToken, 或是收益了 50 daiToken 后, 就会向此 Transmuter 合于中转入 50 daiToken, 后续其他用户就可以通过 transmuter 接口把 alUSD 转换为 daiToken.

- stake  
  用户质押 alUSD 到 Transmuter 合约中, 用于换取真正的 daiToken 收益.  
  比如用户用户质押了 100 alUSD, 那么后续随着 Transmuter 中存在的 daiToken 越多, 那么用户的收益也会越多, 最终可以把 100 alUSD 全部转化为 daiToken 进行提取.

- unstake  
  和 stake 相反的操作, 表示用户从 Transmuter 合约中提取 alUSD.

- transmuter & claim  
  用户根据质押的 alUSD 产生的 daiToken 收益后, 就可以把相应的收益进行提取.  
  比如用户质押了 100 alUSD, 产生了 10 daiToken 的收益, 那么用户调用 transmuter 接口就可以把这个 10 daiToken 进行释放, 然后使用 claim 接口进行提取.  
  但是如果用户质押了 100 alUSD, 产生了 110 daiToken 的收益, 那么用户也只能提取 100 daiToken, 多出来的 10 daiToken 的收益会重新分配给 Transmuter 中所有质押 alUSD 的用户, 相当于用户损失了 10 daiToken.

- 用户收益计算  
  比如 Transmuter 中初始 alUSD 质押为 0, 之后用户 A 质押了 100 的 alUSD. 一段时间后, Alchemist 合约产生了收益 ( 记为 profit ), 并转入了 10 daiToken. 这个时候用户 A 的收益为 0, 因为从用户 A 质押 alUSD 到 Tranmuter 存入 10 daiToken 的前, Transmuter 是没有 daiToken 的, 所有用户 A 没有任何收益. 之后, Alchemist 合约再次产生了收益, 转入了 20 daiToken, 这个时候 Transmuter 会计算累加的收益权重 totalDividendPoints , 计算公式如下:
  CurrentTotalDividendPoints  
  = LasttotalDividendPoints + (( 当前 Transmuter 中未非配的收益 ) / 总的 alUSD 质押量 )  
  = 0 + ( 10 / 100 )  
  = 0.1

之后, 如果用户进行 stake 或是 unstake, 就会更新用的收益到 tokensInBucket[account] 中, 同时更新用户的 lastDividendPoints[account], 避免重复计算收益

### alUSD 的作用功能

仔细观察上述 Alchemist 和 Transmuter 两个合约的处理流程中, 会发现 alUSD 在其中起到了很重要的作用.  
在 Alchemist 中, 用户存入资产后, 产生的收益不能直接取出, 但是可以用作生成额外的 alUSD, 这额外的 alUSD 连同本金生成的 alUSD 投入到 Transmuter 中才能获取真正的收益.  
这里项目方这样操作的目的在于避免 alUSD 被边缘化用户收益的提取中间币, 导致 alUSD 毫无价值.  
按照 Alchemist 现在的逻辑功能来看, 用户想要获取更多的收益, 必须要合成更多的 alUSD, 同时要长时间的持有, 这样就会造成 alUSD 的价值提升.

## 测试流程

- 安装依赖

```bash
yarn
```

- 测试合约

```bash
npx hardhat test
```

## 参考文档

- Github 仓库地址: https://github.com/alchemix-finance/alchemix-protocol
- Alchemix 白皮书: https://alchemix.fi/c76d1d663f6c8247b86a8fca83d5bd1b.pdf
- Medium: https://alchemixfi.medium.com/
- twitter: https://twitter.com/alchemixfi
- Discord: https://discord.com/invite/zAd6dzgwaj
- Youtube: https://www.youtube.com/channel/UCh2HgfcLb5zMLQ2Yi9Wl5QA/featured
