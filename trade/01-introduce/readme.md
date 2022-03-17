# 介绍 
在进行量化交易前，先介绍两个重要的 python 库类 pandas， ccxt

## pandas 
[pandas](https://pandas.pydata.org/) 是基于NumPy 的一种工具，该工具是为解决数据分析任务而创建的。Pandas 纳入了大量库和一些标准的数据模型, 提供了高效地操作大型数据集所需的工具。pandas提供了大量能使我们快速便捷地处理数据的函数和方法。  

## ccxt  
[CCXT](https://github.com/ccxt/ccxt) 是一个用于加密货币电子化交易的 JavaScript / Python / PHP 库，支持诸多比特币/以太币/山寨币交易市场的交易 API。 CCXT 库可用于世界各地的加密货币/山寨币交易所的连接和交易，以及转账支付处理服务。它提供了快速访问市场数据的途径，可用于存储数据，分析，可视化，指标开发，算法交易，策略回测，机器人程序，网上商店集成及其它相关的软件工程。


## 安装 pandas 和 ccxt  
```
pip3 install pandas
pip3 install ccxt
```

## 创建交易账户及 API Key 
以 Okx 为例，在 Okx 注册账户后，我们需要创建子账户及子账户 API Key，这样可以最大限度的进行安全隔离。
即使子账户的用户密码丢失，不至于使我们的资金全部丢失；同时我们可以设置子账户 API Key 的权限，使之只具有 读取/交易的权限，无法进行资金提取。  
具体可以参考 Okx 官网文档查看如何创建子账户及 API Key。

## 配置 API key 
```shell
cp env.example.py env.py
```

在 env.py 中配置子账户的 apiKey / secret / password 

## 交易所接口  
以 okx 为例， 查看 [okx 官网 API](https://www.okx.com/docs-v5/zh/#rest-api) 文档，看到 "REST API" 中的各类接口介绍。
 <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/trade/okxAPI.png?raw=true" /></center>  

- 获取 ccxt 中对交易所封装后的接口  
执行如下命令，会在当前目录下生成 "attr.txt" 文件，其中列举了 ccxt 对 okx 封装后的所有接口
```shell
python listAttr.py
```

- ccxt 封装接口特点  
查看 attr.txt 文档中列举的所有接口，根据接口名字分为如下两类：  
1. 下划线分割和驼峰格式的相同接口：  
 如下两个不同格式的相同接口，在使用上没有没有区别。不过建议使用 "public_get_market_candles" 这种格式的接口，可以在 vscode 上跳转到函数定义   
```shell 
public_get_market_candles    
publicGetMarketCandles   
```    

2. 公共接口和私有接口  
如下，最后一个接口前带有 private 字样，表示是此交易所的私有接口函数，也是可以调用的，不过在 vscode 上无法查看函数定义。
```shell
public_get_public_open_interest
fetch_trades
privateGetAccountAccountPositionRisk
```

- 根据官方 API 文档查找对应接口  
在 [官方 API 文档](https://www.okx.com/docs-v5/zh/#rest-api-trade-place-order) 中找到下单部分，可以看到 HTTP 请求的接口名字为 trade ( 最后一个单词 )。然后在 attr.txt 中搜索关键字 "trade" ，就可以看到对应带有 "trade" 名称的接口，根据接口名称就可以找到我们需要的接口。如果有 API 相关问题，可以添加官方 QQ 后请求技术支持
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/trade/create_order.png?raw=true" /></center> 

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/trade/search_order.png?raw=true" /></center> 

- 调用 API 接口  
执行 trades.py ，会打印出最新的 "CRV-USDT" 现货 K 线数据。   
trades.py 中同时也有进行基础交易的代码样例，调用前需要确保账户中对应资产余额充足。
```shell
python trades.py 
```

- 获取 instId  
查看官方的交易接口，可以发现大部分接口都需要传入一个重要的参数 "instId"，这个参数就是交易对 ID。   
进入官方的交易页面，打开浏览器的调试模式，然后进行操作，就可以看到页面发送的 HTTP 请求消息中传入的 instId  
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/trade/get_Instid.png?raw=true" /></center> 

## 参考文档 
pandas 官网: https://pandas.pydata.org/  
pandas API: https://pandas.pydata.org/docs/reference/index.html  
pandas 菜鸟教程: https://www.runoob.com/pandas/pandas-tutorial.html    
ccxt github 地址: https://github.com/ccxt/ccxt    
ccxt 中文教程: http://cw.hubwiz.com/card/c/ccxt-dev-manual/  
okx 官网: https://www.okx.com/  
okx API 技术支持： QQ号：1905481750

 