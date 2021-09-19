## 起源

最近在学习 Uniswap V2 中的一些数学运算，为了方便理解，我在 desmos 上做了一个可交互的曲线，[地址在这](https://www.desmos.com/calculator/youuxzbvr7)

目前功能相对简单，可以展示 注入/销毁流动性，Swap 交易，调整 fee；另外展示了一些辅助线，比如预期价格切线，成交价格的滑点等

原本准备加上无常损失，以及套利公式的一些分析，但由于时间不够，只能先搁置了

这里做下基础演示，隐藏功能自行尝试吧 ～.

## 注入/销毁流动性

![](./images/uniswap_v2_mint.gif)

按比例注入交易对，其市场价格不变

## 调整市场价格

![](./images/uniswap_v2_reserve.gif)

## 兑换

![](./images/uniswap_v2_swap.gif)

<img src="https://render.githubusercontent.com/render/math?math=\Delta%20X" /> 越大，实际成交价格越偏离市场价格

## 调整手续费

![](./images/uniswap_v2_fee.gif)

Uniswap V2 固定为 `0.3%`，实际不能调整

## 后续

开始学习 [dfinity](https://dfinity.org/)，顺便学习 Rust

可能会用 Rust 实现一个套利机器人，希望完成后会回来补上..

