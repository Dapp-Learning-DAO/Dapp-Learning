# FIFSRegistrar.sol 合约介绍   
FIFSRegistrar 是子域名注册器, 用户设置没有被注册的子域名, 或是更改已经注册的子域名 ( 属于调用者的子域名 )  

## 合约接口解析  
- only_owner     
用户判断注册子域名的状态. 如果子域名没有被注册, 或是当前子域名属于调用者, 则允许调用; 负责不允许更改子域名状态
```solidity
modifier only_owner(bytes32 label) {
        address currentOwner = ens.owner(keccak256(abi.encodePacked(rootNode, label)));
        require(currentOwner == address(0x0) || currentOwner == msg.sender);
        _;
    }
```

- constructor  
构造器中设置了 ENS 的地址和当前的父域名的 Hash 
```solidity
constructor(ENS ensAddr, bytes32 node) public {
        ens = ensAddr;
        rootNode = node;
    }
```

- register  
子域名注册接口, 调用者通过调用这个接口进行子域名注册. 
如果我们回到 ENS 合约中观察 ens.setSubnodeOwner 这个接口, 就会发现调用这个接口的时候, ENS 合约会检查 rootNode 域名对应的 owner 是否为调用者 ( 这里为 FIFSRegistrar 合约 ), 所以 ENS 一级域名 ( 如 .eth ,  .com  域名 ) 的所有者是当前 FIFSRegistrar 合约, 这样当 FIFSRegistrar 调用 ens.setSubnodeOwner 接口时, 就可以成功进行调用
```solidity
function register(bytes32 label, address owner) public only_owner(label) {
        ens.setSubnodeOwner(rootNode, label, owner);
    }
}
```

## 总结  
一般这个这个合约是给一级域名使用的, 对于用户说, 用户在获得对应的二级、 三级 域名后, 可以直接调用 ENS 接口进行相应的设置