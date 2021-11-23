## ControlledTokenProxyFactory 介绍  
ControlledToken 合约的代理合约. 通过和此合约进行交互, 从而执行被代理的 ControlledToken 合约上的功能. 后续 ControlledToken 进行升级后, 修改被代理合约的新地址为新部署的 ControlledToken 合约地址, 即可完成 ControlledToken 的升级. 

## 主要接口介绍  
- create  
创建被代理的 ControlledToken 合约。实际上是 clone 合约内部已经创建的 Controlled ( instance ) 
```solidity
/// @notice Creates a new Controlled ERC20 Token as a proxy of the template instance
  /// @return A reference to the new proxied Controlled ERC20 Token
  function create() external returns (ControlledToken) {
    return ControlledToken(deployMinimal(address(instance), ""));
  }

function deployMinimal(address _logic, bytes memory _data) public returns (address proxy) {
    // Adapted from https://github.com/optionality/clone-factory/blob/32782f82dfc5a00d103a7e61a17a5dedbd1e8e9d/contracts/CloneFactory.sol
    bytes20 targetBytes = bytes20(_logic);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(clone, 0x14), targetBytes)
      mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      proxy := create(0, clone, 0x37)
    }

    emit ProxyCreated(address(proxy));

    if(_data.length > 0) {
      (bool success,) = proxy.call(_data);
      require(success, "ProxyFactory/constructor-call-failed");
    }
  }
```