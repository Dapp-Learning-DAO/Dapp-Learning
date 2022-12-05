中文 / [English](./README.md)

# AAVE v3 闪电贷介绍

1. 您的合约调用 Pool 合约，使用 flashLoanSimple() 或 flashLoan() 请求一定数量储备金的闪电贷。
2. 经过一些合理性检查后，Pool 将请求的储备金额转移到您的合约，然后在接收方合约上调用 executeOperation()。
3. 你的合约现在持有闪贷金额，在其代码中执行任意操作。
   1. 如果您正在执行 flashLoanSimple，那么当您的代码完成后，您批准 Pool 以获得闪电贷款金额 + 费用。
   2. 如果您正在执行闪贷，那么对于所有准备金，取决于为资产传递的利率模式，池必须获得闪贷金额 + 费用的批准，或者必须有足够的抵押品或信用委托才能开立债务头寸。
   3. 如果欠款不可用（由于缺乏余额或批准或债务抵押品不足），则交易将被撤销。
4. 以上所有发生在 1 笔交易中（因此在单个以太坊区块中）。


＃ 步骤
- 安装依赖项
```shell
yarn
```

- 配置环境
```外壳
cp .env.example .env
# 在 .env 中设置 INFURA_ID、PRIVATE_KEY、ETHERSCAN_APIKEY
```

- 启动闪贷 && 借贷->铸币->还贷
```外壳
npx hardhat scripts/deploy_aavev3_flashloan.js --network goerli
```

## 参考链接
- 闪贷文档：https://docs.aave.com/developers/guides/flash-loans
- V3 测试网地址：https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses
- 获取goerli Dai Token：https://goerli.etherscan.io/address/0xdf1742fe5b0bfc12331d8eaec6b478dfdbd31464