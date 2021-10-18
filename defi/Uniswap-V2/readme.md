## 介绍  
Uniswap V2 研究小组的成果输出, 从白皮书, 合约代码, 再到前端代码都进行了深入的讲解, 给初次接触 Uniswap V2 的开发者以细致详尽的讲解.  
同时研究小组把分析的视频上传到了 BiliBili , 具体可参考如下链接.

Uniswap V2 白皮书讲解: https://www.bilibili.com/video/BV11L41147VN?spm_id_from=333.999.0.0   
Uniswap V2 前端代码解析-part 1:  https://www.bilibili.com/video/BV1Uv411N7Ry?spm_id_from=333.999.0.0  

# Uniswap V2

## Contract
主要合约 :
- `UniswapV2Router02`: 路由合约，负责跟用户交互；
- `UniswapFactory`: 工厂合约，常见pair(即pool);
- `UniswapPari`: 具体交易对合约，负责实际交易。

## SDK

## Design Comments

关于设计的一些思考 [design comments](./design/design-comments.md)

一些动图演示 [graphs](./design/graphs.md)

## Interface

Interface 是 User Interface 的含义，此为 Uniswap 网站的代码，包括 token交易,添加和移除流动性等功能。

- 代码分析使用版本 `tag 3.2.7`
- UniswapV2Interface 源码地址：https://github.com/Uniswap/uniswap-interface/tree/v3.2.7

内容目录:

- 使用的技术栈
- 需要提前了解的知识点
- State 数据的结构
- Multicall State 解析
- 用户使用流程及 State 的变化
- 代码解析
- 相关辅助数据
- 相关引用

详细内容请戳这里 :point_right: [UniswapV2 Interface Guid](./Interface/readme.md)

## 参考链接
- 如何 Fork uniswap: https://www.youtube.com/watch?v=U3fTTqHy7F4   
- 将UniswapV2部署到所有区块链:  https://www.youtube.com/watch?v=TCYnec5G9pE  
- 构建一个简单的交易所: https://medium.com/@austin_48503/%EF%B8%8F-minimum-viable-exchange-d84f30bd0c90  
- 手把手教你开发去中心化交易所:  <https://www.bilibili.com/video/BV1jk4y1y7t9?p=1>  
- 将UniswapV2部署到所有区块链—去中心化交易所Uniswap多链部署教学视频:  <https://www.bilibili.com/video/BV1ph411e7bT?p=1>  
- V2交易界面: https://app.uniswap.org/#/swap?use=V2  
