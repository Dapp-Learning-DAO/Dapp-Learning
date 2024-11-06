Frax 的算法稳定性（Algorithmic Stability）设计最初通过部分算法、部分抵押来动态调整其稳定币（FRAX）的供应，最终实现价格锚定。   
以下将通过技术分析和 JavaScript 演示来解释其原理。

### 1. **算法稳定的基础原理**

Frax 使用部分抵押和部分算法调节的机制来维持其稳定性。

- **抵押部分**：一部分 FRAX 是通过资产（如 USDC）完全抵押的。
- **算法部分**：另一部分 FRAX 是通过治理代币 FXS 作为铸币和销币工具。

当 FRAX 的市场价格偏离 $1 的目标时：
- **当 FRAX > $1**：系统会通过铸造更多 FRAX 来降低价格。
- **当 FRAX < $1**：系统会通过销毁 FRAX 来提升价格。

### 2. **关键参数**

- **Collateral Ratio (CR)**：抵押比率，代表有多少 FRAX 由抵押品支持。  
  初始设定 CR < 100%，通过市场和算法动态调整。

- **Target Price**：目标价格 $1。

- **Market Price**：FRAX 当前的市场价格。

### 3. **算法演示**

通过简单的 JS 模拟，展示如何根据市场价格动态调整 FRAX 和 FXS 的供需：

```javascript
// 假设市场价格与抵押比率的关系，动态调整 CR
let fraxPrice = 1.02; // 当前FRAX市场价格
let collateralRatio = 0.8; // 初始抵押比率
const targetPrice = 1.00; // 目标价格

function adjustCollateralRatio(currentPrice) {
    if (currentPrice > targetPrice) {
        // 价格高于目标价，需要降低抵押率以铸造更多FRAX
        collateralRatio -= 0.01; 
    } else if (currentPrice < targetPrice) {
        // 价格低于目标价，提高抵押率以减少FRAX供应
        collateralRatio += 0.01;
    }
    collateralRatio = Math.max(0, Math.min(1, collateralRatio)); // 确保CR在[0,1]范围内
    return collateralRatio;
}

// 模拟市场价格波动与抵押率动态调整
for (let i = 0; i < 10; i++) {
    console.log(`Iteration ${i + 1}`);
    console.log(`Market Price: $${fraxPrice.toFixed(2)}`);
    console.log(`Collateral Ratio: ${(adjustCollateralRatio(fraxPrice) * 100).toFixed(2)}%`);

    // 模拟市场价格变动
    fraxPrice += (Math.random() - 0.5) * 0.05; 
}
```

### 4. **代码解释**

- **初始价格和抵押率**：设置 FRAX 初始市场价格为 1.02，抵押率为 80%。
- **动态调整**：根据价格偏离目标值的程度调整抵押率，市场价格高于 $1 时降低抵押率，反之亦然。
- **模拟市场波动**：通过 `Math.random()` 生成随机价格波动。

### 5. **实际运行效果**

在实际的 Frax 协议中，这个过程会通过链上智能合约实现，结合 AMM（如 Fraxswap）和治理模块进行稳定性调控。

### 6. **改进后的完全抵押模式**

随着 Frax v3 的升级，FRAX 已转向完全抵押机制（100% CR）。算法部分更多用于流动性管理和收益生成（如 AMO）。

如果你希望运行这段代码并观察模拟结果，请告知，我可以为你提供实时演示！