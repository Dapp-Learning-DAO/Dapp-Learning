# 介绍  
当 Strategy 调用 Vault 的 report 接口上报收益或亏损的时候，会对 Strategy 进行必要的健康检查，避免 Strategy 的错误上报。

## 合约分析  
- _executeDefaultCheck    
CommonHealthCheck 合约中最核心的就是这个 _executeDefaultCheck 接口了，用于判断当前 Strategy 是否处于健康状态。 
这里主要用到了两个参数 profitLimitRatio 和 lossLimitRatio。 profitLimitRatio 用于设定 Strategy 的收益率，从代码中可以看到，使用 totalDebt 为基数，根据 profit 和 totalDebt * profitLimitRatio 的大小来判断。当 profit 大于 totalDebt * profitLimitRatio 时，判断当前 Strategy 处于异常状态。 这里设定 profitLimitRatio 的原因是避免 Strategy 因黑客攻击，造成 Strategy 的收益在 report 时变得异常，从而使黑客得利。当 Strategy 异常时，Vault 就可以拒绝 对 Strategy 进行收益结算。
同理， lossLimitRatio 也是同样的作用。  
```solidity
function _executeDefaultCheck(
        address strategy,
        uint256 _profit,
        uint256 _loss,
        uint256 _totalDebt
    ) internal view returns (bool) {
        Limits memory limits = strategiesLimits[strategy];
        uint256 _profitLimitRatio;
        uint256 _lossLimitRatio;
        if (limits.exists) {
            _profitLimitRatio = limits.profitLimitRatio;
            _lossLimitRatio = limits.lossLimitRatio;
        } else {
            _profitLimitRatio = profitLimitRatio;
            _lossLimitRatio = lossLimitRatio;
        }

        if (_profit > ((_totalDebt * _profitLimitRatio) / MAX_BPS)) {
            return false;
        }
        if (_loss > ((_totalDebt * _lossLimitRatio) / MAX_BPS)) {
            return false;
        }
        return true;
    }
```
