# 翻译说明

> * 对于翻译中不明确的词汇会将原词汇跟随在翻译词汇后。

# 协议组件

协议、组成部分和术语的概述。

### 概述

Wyvern 是一阶(first-order)去中心化交换协议。可比较的现有零阶(zeroeth-order)协议，例如[Etherdelta](https://github.com/etherdelta/smart_contract)、[0x](https://github.com/0xProject/0x-monorepo)和[Dexy](https://github.com/DexyProject/protocol)：每个订单指定了两个离散资产（通常是特定比率和最大数量的两个代币）的所需交易。相对于零阶协议，Wyvern 订单改为指定状态转换的谓词：订单是一个函数，将订单构建者(maker)发出的调用、交易的另一方发出的调用和订单元数据映射到布尔值（订单是否匹配）。这些谓词是任意的——以太坊上可表示的任何资产或资产的任何组合都可以用 Wyvern 订单进行交换——事实上，Wyvern 可以实例化所有上述协议。

