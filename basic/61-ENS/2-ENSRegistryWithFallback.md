# ENSRegistryWithFallback.sol 合约介绍   
ENSRegistryWithFallback 同 ENSRegistry 功能相同, 唯一的区别是当对应的域名信息在当前合约中不存在时, 会去旧 ENS 合约中查找对应的数据

## 合约接口解析  
- construct   
在 constrcut 中设置旧 ENS 合约地址 
```solidity
constructor(ENS _old) public ENSRegistry() {
        old = _old;
    }
```

- resolver 
查找对应域名 Hash 对应的反向解析器, 如果当前 ENS 中没有查找到, 就在 old ENS 中查找 
```solidity
function resolver(bytes32 node) public override view returns (address) {
        if (!recordExists(node)) {
            return old.resolver(node);
        }

        return super.resolver(node);
    }
```

- owner   
查找域名的所有者,  如果当前 ENS 中没有查找到, 就在 old ENS 中查找
```solidity
function owner(bytes32 node) public override view returns (address) {
        if (!recordExists(node)) {
            return old.owner(node);
        }

        return super.owner(node);
    }
```

- ttl  
查找域名的 TTL , 如果当前 ENS 中没有查找到, 就在 old ENS 中查找
```solidity
function ttl(bytes32 node) public override view returns (uint64) {
        if (!recordExists(node)) {
            return old.ttl(node);
        }

        return super.ttl(node);
    }
```