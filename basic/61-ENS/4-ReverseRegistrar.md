# ReverseRegistrar.sol 合约介绍   
ReverseRegistrar 反向域名解析器注册器, 用户注册反向域名解析器.  
反向域名解析器即把对应的域名 Hash 转换为可读域名 , 如 "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2" => 'addr.reverse'.   
在 ENS 合于中, 我们了解到可以通过查询 Graph 获取 "owner address" => "node Hash" 的映射, 但这里获取 "node Hash" 后，依然不是可读字符, 需要把它转换为可读字符.  

## 合约接口解析  
- constructor       
在构造器中, 设置 ENS 地址和 反向域名解析器地址.  
在部署时, 如果叶子域名对应的所有者不是合约部署者, 则设置叶子域名的所有者为合约部署者.  
举例来说, 如果存在域名 .edu.eth , 那么用户 0x00123 在这个域名下的叶子域名为 0x00123.edu.eth , 那么设置 0x00123.edu.eth 域名的所有者为 0x00123
```solidity
constructor(ENS ensAddr, NameResolver resolverAddr) public {
        ens = ensAddr;
        defaultResolver = resolverAddr;

        // Assign ownership of the reverse record to our deployer
        ReverseRegistrar oldRegistrar = ReverseRegistrar(ens.owner(ADDR_REVERSE_NODE));
        if (address(oldRegistrar) != address(0x0)) {
            oldRegistrar.claim(msg.sender);
        }
    }
```


- claim    
转移叶子域名的所有者到对应的用户.  
此接口主要在部署新 ReverseRegistrar 合约的时候, 调用旧  ReverseRegistrar 合约的  claim  时使用
```solidity
function claim(address owner) public returns (bytes32) {
        return claimWithResolver(owner, address(0x0));
    }
```

- setName   
设置域名 Hash 的对应的可读字符, 比如 "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2" => 'addr.reverse'
```solidity
function setName(string memory name) public returns (bytes32) {
        bytes32 node = claimWithResolver(address(this), address(defaultResolver));
        defaultResolver.setName(node, name);
        return node;
    }
```

- claimWithResolver 
设置域名 Hash 的反向解析器,主要在两个接口中被调用.  
1) claim :  转移叶子域名的所有者到对应的用户. 调用时, resolver 为 0 地址, 此时不更新 resolver 地址, 只更新 owner 地址
2) setName :  owner 和 resolver 参数都不为 0 地址, 此时先更新叶子域名 ( 如 0x001234.edu.eth ) 的 owner 为当前合约. 注意, 这里更新 owner 的原因为在后续的 ens.setResolver(node, resolver) 中需要 owner 权限的地址才能调用, 所有这里需要先进行权限转移. 然后再调用  ens.setResolver(node, resolver) 进行解析器地址的更新.
```solidity  
function claimWithResolver(address owner, address resolver) public returns (bytes32) {
        bytes32 label = sha3HexAddress(msg.sender);
        bytes32 node = keccak256(abi.encodePacked(ADDR_REVERSE_NODE, label));
        address currentOwner = ens.owner(node);

        // Update the resolver if required
        if (resolver != address(0x0) && resolver != ens.resolver(node)) {
            // Transfer the name to us first if it's not already
            if (currentOwner != address(this)) {
                ens.setSubnodeOwner(ADDR_REVERSE_NODE, label, address(this));
                currentOwner = address(this);
            }
            ens.setResolver(node, resolver);
        }

        // Update the owner if required
        if (currentOwner != owner) {
            ens.setSubnodeOwner(ADDR_REVERSE_NODE, label, owner);
        }

        return node;
    }
```
