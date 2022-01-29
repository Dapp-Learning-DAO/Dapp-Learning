# ENSRegistry.sol 合约介绍   
ENSRegistry 是 ENS 的主合约, 用于注册用户地址对应的域名

## 合约接口解析  
- construct   
在 constrcut 中设置根域名的拥有者为合约的部署者, 之后设置一级子域名的时候会校验调用者是否为根域名的拥有者  
```solidity
constructor() public {
        records[0x0].owner = msg.sender;
    }
```

- authorised 
authorised 修饰器确保只有对应域名的 owner 才能进行相应的操作  
```solidity
modifier authorised(bytes32 node) {
        address owner = records[node].owner;
        require(owner == msg.sender || operators[owner][msg.sender]);
        _;
    }
```

- setOwner   
转移域名的所有权, 转移时会校验被转移域名的所有者是否为当前的调用者 
```solidity
function setOwner(bytes32 node, address owner) public virtual override authorised(node) {
        _setOwner(node, owner);
        emit Transfer(node, owner);
    }
```

- setResolver  
设置域名的反相解析器, 此解析器可以用来反向解析域名 Hash 对应的可读域名, 比如 "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2" => 'addr.reverse'
```solidity
function setResolver(bytes32 node, address resolver) public virtual override authorised(node) {
        emit NewResolver(node, resolver);
        records[node].resolver = resolver;
    }
```

- setTTL  
设置域名的过期时间, 时间单位为 秒, 比如设置 ttl 为 3600, 表示 1 个小时后此域名过期  
```solidity
function setTTL(bytes32 node, uint64 ttl) public virtual override authorised(node) {
        emit NewTTL(node, ttl);
        records[node].ttl = ttl;
    }
```

- setRecord  
设置域名的拥有者, 反向解析器地址, ttl 时间. 这个方法是在域名已经存在的情况后, 进行设置的  
```solidity
function setRecord(bytes32 node, address owner, address resolver, uint64 ttl) external virtual override {
        setOwner(node, owner);
        _setResolverAndTTL(node, resolver, ttl);
    }
```

- setSubnodeOwner  
设置子域名的拥有者, 所有一级域名及后续的子域名都需要通过这个接口进行设置
```solidity
function setSubnodeOwner(bytes32 node, bytes32 label, address owner) public virtual override authorised(node) returns(bytes32) {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        _setOwner(subnode, owner);
        emit NewOwner(node, label, owner);
        return subnode;
    }
````


## 总结  
观察 ENSRegistry 的接口和内部变量, 可以看到合约中只处理了从 "node" => "owner address" 即域名到拥有者的映射, 但没有处理从 "owner address" => "node" 的映射.  
其实, 从 "owner address" => "node" 的映射可以通过 Graph 进行处理, 在 setOwner 接口中会出发 Transfer 事件, 而通过 Graph 的处理, 就可以得到 "owner address" => "node" 的映射关系. 