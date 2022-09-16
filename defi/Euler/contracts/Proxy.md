# Euler Proxy

## constructor

构造函数内指定创建者为 creator。

```solidity
constructor() {
    creator = msg.sender;
}
```

通常是 `Euler.sol` 合约为每个模块创建 Proxy 合约实例, 并映射到对应的 implementation 合约。

```solidity
// src/Euler.sol

contract Euler is Base {
    constructor(address admin, address installerModule) {
        ...

        moduleLookup[MODULEID__INSTALLER] = installerModule;
        address installerProxy = _createProxy(MODULEID__INSTALLER);
        trustedSenders[installerProxy].moduleImpl = installerModule;
    }
    ...
}
```

- [BaseLogic#_createProxy](./BaseLogic.md#_createProxy)

## fallback

因为 proxy 没有其他函数，所有调用都会进入 fallback （常见的proxy原理）。

Euler 的fallback做了改造，若是来自模块调用，则进入发送日志逻辑，而来自模块之外的调用则统一调用 `Euler.dispatch` 函数。这样做的目的是为了让通过 `emitViaProxy_Transfer` 和 `emitViaProxy_Approval` 发出的event会通过 proxy 合约发送，而不是具体的模块逻辑合约。

`Euler.dispatch` 会调用对应模块的 implementation 合约。

```solidity
// External interface

fallback() external {
    address creator_ = creator;

    if (msg.sender == creator_) {
        assembly {
            mstore(0, 0)
            calldatacopy(31, 0, calldatasize())

            switch mload(0) // numTopics
                case 0 { log0(32,  sub(calldatasize(), 1)) }
                case 1 { log1(64,  sub(calldatasize(), 33),  mload(32)) }
                case 2 { log2(96,  sub(calldatasize(), 65),  mload(32), mload(64)) }
                case 3 { log3(128, sub(calldatasize(), 97),  mload(32), mload(64), mload(96)) }
                case 4 { log4(160, sub(calldatasize(), 129), mload(32), mload(64), mload(96), mload(128)) }
                default { revert(0, 0) }

            return(0, 0)
        }
    } else {
        assembly {
            mstore(0, 0xe9c4a3ac00000000000000000000000000000000000000000000000000000000) // dispatch() selector
            calldatacopy(4, 0, calldatasize())
            mstore(add(4, calldatasize()), shl(96, caller()))

            let result := call(gas(), creator_, 0, 0, add(24, calldatasize()), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
                case 0 { revert(0, returndatasize()) }
                default { return(0, returndatasize()) }
        }
    }
}
```
