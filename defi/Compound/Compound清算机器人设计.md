# Compound清算机器人设计

清算机器人的目的是为了帮助协议清算有风险的债务，同时获得协议奖励。

清算的总体步骤包括（假设使用闪电贷）：

- 发现待清算债务
- 计算需清算债务金额
- 闪电贷借出债务
- 偿还债务获得抵押物cToken
- 抵押物cToken赎回抵押物
- 交易抵押物偿还闪电贷


## 发现待清算债务

这部分实际是比较有难度的，因为直接从合约里面无法读取所有借款人。我的方法是自己通过扫区块构建的event数据库里面获得的，也可以通过the graph这样的工具。

从主合约里能获得所有cToken，通过筛选event，关联到cToken合约的Borrow事件可以找到借款人。

得到借款人后，需要检查每个借款人的抵押率。可以参考合约中getAccountLiquidity的方法来计算抵押率。

将抵押率较低的借款账户选出来，提高检查的频率，最好可以监控预言机交易，因为只有价格更新后，抵押率才会发生变化。

## 计算待清算金额

债务的抵押物可能是多种，清算时需要选取清算的金额和获得的抵押物，需要根据抵押物的比例，计算出清算债务的金额。

也有一个比较简单粗暴的方法，就是多次尝试，如果失败（estimate失败）就将金额进行调整。

## 闪电贷借出债务

考虑到后面需要将抵押物交易回债务偿还闪电贷，所以一般选择uniswap的闪电贷，除了交易费，没有其他的费用。

如果抵押物和债务直接的交易对深度不好，还需要选择更好的交易路径。

具体闪电贷swap的逻辑不在这里展开，和清算无关

## 偿还债务获得抵押物

ETH和ERC20的方法有点差异，这里就简单说一下ERC20的方法。

```
err = CErc20Interface(params.cTokenBorrowAddr).liquidateBorrow(
                params.borrower,
                params.liquidateAmount,
                params.cTokenCollateralAddr
            );
```

调用债务cToken合约的liquidateBorrow方法，传入借款人，清算债务实际token的数量，希望获得的抵押物（cToken）

## 抵押物cToken赎回抵押物

```
uint256 cTokenCollateralBalance = IERC20(params.cTokenCollateralAddr)
            .balanceOf(address(this));

err = CErc20Interface(params.cTokenCollateralAddr).redeem(
            cTokenCollateralBalance
        );
```

从抵押物cToken合约赎回抵押物

## 交易抵押物偿还闪电贷

在构建闪电贷的时候，从 A-B LP 从借出A可以还B，具体金额关系也是用乘积公示计算，这里不展开。

将需要偿还的抵押物还给闪电贷LP，剩下的就是利润。

