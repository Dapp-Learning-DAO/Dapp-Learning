
## The lifecycle of data in IPFS
1. Content-addressable representation

The file is transformed into a content-addressable representation using a CID. The basic idea is that this representation makes files and directories content-addressable via CIDs by chunking files into smaller blocks, calculating their hashes, and constructing a Merkle DAG.


2. Pinning

. Simply saving the CID on the node does not mean the CID is retrievable, so pinning must be used. Pinning allows the node to advertise that it has the CID, and provide it to the network.

Advertising: In this step, a CID is made discoverable to the IPFS network by advertising a record linking the CID and the server's IP address to the DHT. Advertising is a continuous process that repeats typically every 12 hours. The term publishing is also commonly used to refer to this step.

Providing: The content-addressable representation of the CID is persisted on one of web3.storage's IPFS nodes (servers running an IPFS node) and made publicly available to the IPFS network.



3. Retrieval

an IPFS node fetches the blocks of the CID and constructs the Merkle DAG. This usually involves several steps:

- Content routing: Content routing is facilitated by either the DHT, asking already connected peers over Bitswap, or making an HTTP call to a delegated routing server like the network indexer. The term content discovery is also commonly used to refer to this step.

- Block fetching: An IPFS node fetches the blocks of the Merkle DAG (of the file or folder) from providers.

- Verification: The IPFS node verifies the blocks fetched by hashing them and ensuring that the resulting hash is correct. Note that this type of retrieval is trustless; that is, blocks can come from any node in the network.

- Local access: Once all blocks are present, the Merkle DAG can be constructed, making the file or directory underlying the CID successfully replicated and accessible.


4. Deleting

## node type 
- Relay
If an IPFS node deems itself unreachable by the public internet, IPFS nodes may choose to use a relay node as a kind of VPN in an attempt to reach the unreachable node.


- Bootstrap
Both Kubo and Helia nodes use bootstrap nodes to initially enter the DHT.


- Delegate routing
When IPFS nodes are unable to run Distributed Hash Table (DHT) logic on their own, they delegate the task to a delegate routing node. Publishing works with arbitrary CID codecs


## Observe Peer 
See who you're directly connected to:
```
ipfs swarm peers
```

Manually connect to a specific peer
```ipfs swarm connect /dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN
```


Search for a given peer on the network:
```
ipfs dht findpeer QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN
```

Prioritizing connections to certain peers is called Peering, and you can tell IPFS which peers to prioritize by editing the Peering configuration in your IPFS config file.

```
{
  "Peering": {
    "Peers": [
      {
        "ID": "QmcfgsJsMtx6qJb74akCw1M24X1zFwgGo11h1cuhwQjtJP",
        "Addrs": ["/dnsaddr/node-8.ingress.cloudflare-ipfs.com"]
      }
    ]
  }
}```


## Sharding IPFS
https://github.com/Alexcitten/ShardingIPFS/blob/main/index.js

## IPFS: pubsub

https://docs.libp2p.io/concepts/pubsub/overview/
(Publish–subscribe pattern)

ipfs pubsub ls -- list all subject of the peer
ipfs pubsub peers -- 
ipfs pubsub pub <topic> <data> -- publish topics
ipfs pubsub sub <topic> -- subscribe topics


## IPFS路由系统
ipfs系统的节点查找有两个需求：
第一找到其他节点地址
第二找到存储有特定数据的节点

IPFS DHT的数据存储是根据数据的大小进行的：

小于1KB的数据直接存储到DHT上面
大于1KB的数据在DHT中存储的是节点ID

### 节点加入
新创建的节点必须知道至少一个已经在网络上的节点地址，连上那个节点，就可以加入网络了，所以ipfs系统提供了bootstrap命令来完成这个工作（通常情况不需要自己来做这样的造作，除非有一些特殊需求，例如：指定自己比较近的启动节点，搭建IPFS私有网络等）。
- ipfs bootstrap list 列出来启动节点
- ipfs bootstrap add [<peer>] 添加启动节点
- ipfs bootstrap rm [<peer>] 删除启动节点

## Merkle DAG
内容寻址：使用多重哈希来唯一识别一个数据块的内容
防篡改：可以方便的检查哈希值来确认数据是否被篡改
去重：由于内容相同的数据块哈希是相同的，可以很容去掉重复的数据，节省存储空间

IPFS 的数据对象结构
```
type IPFSLink struct {
Name string // link 的名字
Hash Multihash // 数据的加密哈希
Size int // 数据大小
}

Type IPFSObject struct {
links []IPFSLink // link数组
data []byte // 数据内容
}
```

ipfs -ls -v 来查看文件的分片
ipfs block stat: 查询block的数据大小，不包含子块。
ipfs refs：列出来数据快的子块信息
ipfs ls or ipfs object links：显示所有的子块和块的大小







## References

- https://docs.ipfs.io/install/command-line/#official-distributions
- Pin API : https://ipfs.github.io/pinning-services-api-spec/
-  the lifecycle of data in IPFS:  
- libp2p: https://docs.libp2p.io/concepts/pubsub/overview/
- ipfs & file coin zhihu: https://www.zhihu.com/people/flytofuture/posts
- ipfs private network  build and use :  https://zhuanlan.zhihu.com/p/35141862
- local first: https://www.inkandswitch.com/local-first/
- sharding :https://github.com/Alexcitten/ShardingIPFS/blob/main/index.js
- orbitdb: https://github.com/orbitdb/orbitdb#browser-script-tag


