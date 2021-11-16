## ControlledTokenProxyFactory 介绍  
ControlledToken 合约的代理合约. 通过和此合约进行交互, 从而执行被代理的 ControlledToken 合约上的功能. 后续 ControlledToken 进行升级后, 修改被代理合约的新地址为新部署的 ControlledToken 合约地址, 即可完成 ControlledToken 的升级. 

## 主要接口介绍  
- create  
创建被代理的 ControlledToken 合约, 在创建过程中, 会在 ControlledToken 中设置 controller 地址为当前 ControlledTokenProxyFactory 地址. 
```solidity
/// @notice Creates a new Controlled ERC20 Token as a proxy of the template instance
  /// @return A reference to the new proxied Controlled ERC20 Token
  function create() external returns (ControlledToken) {
    return ControlledToken(deployMinimal(address(instance), ""));
  }
```