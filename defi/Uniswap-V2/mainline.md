 # 主线任务

 ## 一、uniswap前端概览
阅读源码包括：
> uniswap-interface   ------------ react页面  
uniswap-sdk-core     ----------- “数据类型定义”  
uniswap-v2-core       ------------ 核心合约（solidity)  
uniswap-v2-periphery  ------ 使用核心合约（solidity)    
uniswap-v2-sdk       ------------  v2版本js，提供第三使用使用的sdk

前端(uniswap-interface)引用 “@uniswap/sdk” ==  uniswap-sdk-core

结论：  
> sdk引用的结构如下为数据模型的引用（类比网站开发的model模块）sdk-core库为业务“元件”使用。在前端使用时用其构建业务代码。 
> 以下为部分引用代码：   
>    import { TokenAmount } from '@uniswap/sdk'  
>	import { Token, TokenAmount, WETH } from '@uniswap/sdk'  
>	import { Percent } from '@uniswap/sdk'  

如果对我的结论有异议，可自行搜索关键字 “@uniswap/sdk” 验证  （搜索uniswap-interface项目)


## 二、代码拆解
开源代码有其构建结构，我们从中学习的构建方式可以丰富编码方式、编码技巧、提高编写逼格。  
在v2案例分析中，核心方向有两点
1. react如何同合约交互（目的：学习代码写法）
2. v2里每个动作的拆解（目的：学习代码写法，学习业务逻辑）

备注：如果不对react熟悉，reducer写法会绕晕你, 请点击 [参见](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/defi/Uniswap-V2/Interface/minimap.md)

### ehterproject 使用案例【如何调用合约】
~~~

// 合约地址
const daiAddress = "0xxxxxxxxxxxxxxxxxxxxxxxxxxxx";

//合约abi
const daiAbi = [
  // Some details about the token
  "function name() view returns (string)",
  "function symbol() view returns (string)",

  // Get the account balance
  "function balanceOf(address) view returns (uint)",

  // Send some of your tokens to someone else
  "function transfer(address to, uint amount)",

  // An event triggered whenever anyone transfers to someone else
  "event Transfer(address indexed from, address indexed to, uint amount)"
];
// provider 通过这里关联你的”小狐狸“
const provider = new ethers.providers.Web3Provider(window.ethereum)

// 构建合约对象
const daiContract = new ethers.Contract(daiAddress, daiAbi, provider);
// 调用合约方法 “balanceOf”
balance = await daiContract.balanceOf(xxxxx)
~~~


下面我对添加流动性的代码做了拆解

### ***2.1 如何“添加流动性”***
需要了解三方库：
>（etherproject）

使用到的合约“路由”地址：
> /uniswap-interface/src/constants/index.ts  
> row 6

 添加流动性点击事件  
> /uniswap-interface/src/pages/AddLiquidity/index.tsx  
> row 128 生成合约方法  
> row 160 提取合约方法  
> row 162 构建参数（此参数和下面的合约方法一一对应） 

调用的合约方法如下  
合约(本合约59行的方法和上诉“点击事件”对应)  
> /uniswap-v2-periphery/contracts/UniswapV2Router01.sol  
> row 59


上述合约内容使用   
estimate = router.estimateGas.addLiquidity  
其中”estimate“ 是估算gas的方法，估算执行”addLiquidity“ 大概的gas费用  
> estimate(...args, value ? { value } : {}).then(大概的费用=>{ 真正的调用过程在这里 })

