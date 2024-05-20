中文 / [English](./README.md)

# AAVE v3 闪电贷介绍

1. 您的合约调用 Pool 合约，使用 flashLoanSimple() 或 flashLoan() 请求一定数量储备金的闪电贷。
2. 经过一些合理性检查后，Pool 将请求的储备金额转移到您的合约，然后在接收方合约上调用 executeOperation()。
3. 你的合约现在持有闪贷金额，在其代码中执行任意操作。
   1. 如果您正在执行 flashLoanSimple，那么当您的代码完成后，您批准 Pool 以获得闪电贷款金额 + 费用。
   2. 如果您正在执行闪贷，那么对于所有准备金，取决于为资产传递的利率模式，池必须获得闪贷金额 + 费用的批准，或者必须有足够的抵押品或信用委托才能开立债务头寸。
   3. 如果欠款不可用（由于缺乏余额或批准或债务抵押品不足），则交易将被撤销。
4. 以上所有发生在 1 笔交易中（因此在单个以太坊区块中）。

## 闪电贷智能合约逻辑说明
### Flashloan 说明   
来看下 `contracts/SimpleFlashLoan.sol`  (aave v3版本)
```solidity

import "https://github.com/aave/aave-v3-core/blob/master/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "https://github.com/aave/aave-v3-core/blob/master/contracts/interfaces/IPoolAddressesProvider.sol";
import "https://github.com/aave/aave-v3-core/blob/master/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

constructor(address _addressProvider) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
   
       owner = payable(msg.sender);
   }


   
```  

这是导入所必要的依赖项，Flashloan 合约继承自`FlashLoanSimpleReceiverBase`，它是一个抽象合约，提供了一些有用的方法，比如如偿还闪电贷的方式。 
SimpleFlashloan.sol 构造函数接受 Aave 的一借贷池的地址(deploy_aave_flashloan.js 脚本中配置对应的PoolAddressesProvider)。

创建地址类型的变量所有者(有些代码中并未设置此owner,意味着所有人都可以调用该合约)，并将其设为可支付。

aave v3 对一些方法做了简化，因此有些方法名称后面加了Simple关键字

aave v3 合约名称相较v1有了变化(其实内部还是调用之前老的合约，可能是觉得之前的名字太长不好记忆，就修改了些), 具体变化参考：[AAVEf : supported-networks](https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses)
本文以Sepolia测试网络为例，选择Ethereum Sepolia，对于不同的测试网络，需要在deploy_aave_flashloan.js 脚本中配置对应的PoolAddressesProvider
<center><img src="./img/aave-v3-namechange.png?raw=true" /></center> 
<center><img src="./img/sepolia-testnet.png?raw=true" /></center> 



### flashloanSimple 方法   
requestFlashLoan 方法中的核心是调用 POOL.flashLoanSimple(), POOL 变量被定义在FlashLoanSimpleReceiverBase中，是IPool 的实例
```solidity
 function flashLoanSimple(
    address receiverAddress,
    address asset,
    uint256 amount,
    bytes calldata params,
    uint16 referralCode
  ) external;

```

如下是 FlashLoanSimpleReceiverBase 合约中的定义(大致了解即可)
```solidity
abstract contract FlashLoanSimpleReceiverBase is IFlashLoanSimpleReceiver {
  IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
  IPool public immutable override POOL;

  constructor(IPoolAddressesProvider provider) {
    ADDRESSES_PROVIDER = provider;
    POOL = IPool(provider.getPool());
  }
  
```

通过连接 Aave 的FlashLoanSimpleReceiverBase合约来启动SimpleFlashLoan合约

requestFlashLoan 的参数`_asset`是我们要用闪电贷借款的资产地址，比如 ETH, DAI 或者 USDC。
<center><img src="./img/token_address.png?raw=true" /></center> 

`uint amount = 1 ether;`
amount 是我们将借用的代币数量,如果把 ETH 地址传过去，我们就会借到 1 个 ETH，即 10^18 wei。如果把 DAI 地址传给 `_asset`，我们就会借到 1 个 DAI。  
还有两个我们不会使用但 Aave 合约需要的参数。

params       - 是贷款的一些附加信息，例如消息或短语    
ReferralCode - 暂时不明白这个参数的含义

FlashLoanSimpleReceiverBase 内部的 _addressProvider 变量将被传入到 IPoolAddressesProvider 接口中，之后将在那里调用 getPool() 函数，该函数将返回代理池（实现闪贷所有功能的合约）的地址。
而这一切都将保存在 POOL 变量中，该变量需要像我们的地址一样被包装在 IPOOL 接口中，以便访问合约的 Proxy Pool 功能。

### executeOperation 方法


```solidity
   function executeOperation(
    address asset, 
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
   ) external override returns(bool){
     str = "New Logic in FlashLoans";

        //
        // Your logic goes here.
        // !! Ensure that *this contract* has enough of `_reserve` funds to payback the `_fee` !!
        //
     uint256 totalAmount = amount + premium;
     IERC20(asset).approve(address(POOL),totalAmount);
     return true; 

   }

}
    
```

在使用 `requestFlashLoan` 函数触发有效的闪电贷后，`executeOperation` 函数的所有参数都将被自动传递，

接下来，我们可以插入任何想要执行的逻辑。在这个步骤中，我们拥有了来自闪电贷的所有可用资金，因此，我们可以尝试套利机会。

我们在用完闪电贷后，就需要偿还资金了。

`uint totalAmount = amount + premium`

在这里，我们要计算还多少钱，也就是 **借款金额 + Aave借贷手续费(通常为金额的0.05%)** , premium 也可以固定设置 amount * 0.05%。

最后一步就是调用 `IERC20(asset).approve(address(POOL),totalAmount)` 来偿还闪电贷。

## AAVE FAUCET
我们的智能合约中需要一些 Testnet USDC(本文使用USD C作为贷款货币) 来支付闪电贷的利息。进入Aave的水龙头，选择Ethereum Market，连接MetaMask，点击USDC附近的 Faucet 即可获取USDC。
<center><img src="./img/aave_faucet.png?raw=true" /></center> 


## 操作步骤 
- 安装依赖  
```shell
#Node 版本v20.11.0
npm init
npm install --save-dev hardhat
npx hardhat
npm install --save-dev "hardhat@^2.21.0" "@nomicfoundation/hardhat-toolbox@^2.0.0"
```

- 安装aav核心包 
```shell
npm install @aave/core-v3
```

- 配置环境变量  
```shell
cp .env.example .env
# 在 .env 中配置  INFURA_ID , PRIVATE_KEY
```

- 部署合约  
```shell
# 这里使用 sepolia 测试网进行测试
npx hardhat run scripts/deploy_aave_flashloan.js --network sepolia

```
交易完成后，根据打印的 Transaction hash 登录 [Etherscan](https://sepolia.etherscan.io/)查看交易详情

<center><img src="./img/etherscan_query.png?raw=true" /></center> 
<center><img src="./img/transaction_detail.png?raw=true" /></center> 

恭喜您执行闪贷；您借了一笔无抵押贷款。在本指南中，我们了解了闪电贷，创建并部署了 Aave V3 闪电贷合约，借入了一些无需抵押的代币，并收取利息费用返还

## 参考链接
- 闪贷文档：https://docs.aave.com/developers/guides/flash-loans
- V3 测试网地址：https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses
- 获取goerli Dai Token：https://goerli.etherscan.io/address/0xdf1742fe5b0bfc12331d8eaec6b478dfdbd31464