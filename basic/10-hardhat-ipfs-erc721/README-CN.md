中文 / [English](./README.md)

## IPFS 介绍

是一个旨在创建持久且分布式存储和共享文件的网络传输协议。它是一种内容可寻址的对等超媒体分发协议。

在 IPFS 网络中的节点将构成一个分布式文件系统。它是一个开放源代码项目，自 2014 年开始由协议实验室在开源社区的帮助下发展。其最初由 Juan Benet 设计  
IPFS 是一个对等的分布式文件系统，它尝试为所有计算设备连接同一个文件系统。在某些方面，IPFS 类似于万维网，也可以被视作一个独立的 BitTorrent 群、在同一个 Git 仓库中交换对象。 换种说法，IPFS 提供了一个高吞吐量、按内容寻址的块存储模型，及与内容相关超链接。这形成了一个广义的 Merkle 有向无环图（DAG）。

IPFS 结合了分布式散列表、鼓励块交换和一个自我认证的名字空间。IPFS 没有单点故障，并且节点不需要相互信任。分布式内容传递可以节约带宽，和防止 HTTP 方案可能遇到的 DDoS 攻击。

该文件系统可以通过多种方式访问，包括 FUSE 与 HTTP。将本地文件添加到 IPFS 文件系统可使其面向全世界可用。文件表示基于其哈希，因此有利于缓存。文件的分发采用一个基于 BitTorrent 的协议。其他查看内容的用户也有助于将内容提供给网络上的其他人。  
IPFS 有一个称为 IPNS 的名称服务，它是一个基于 PKI 的全局名字空间，用于构筑信任链，这与其他 NS 兼容，并可以映射 DNS、.onion、.bit 等到 IPNS。

todo 1155 left

## IPFS 安装

IPFS 有多种方式:

- IPFS Desktop: 直接运行的应用程序，适合所有人
- Command-line: 命令行方式安装, 这里我们选择这种安装方式, 下面以 mac 下这种安装方式为例进行讲解，其他系统安装方式参考文档

1. 下载文件

```bash
wget https://dist.ipfs.io/go-ipfs/v0.8.0/go-ipfs_v0.8.0_darwin-amd64.tar.gz
```

2. 解压缩

```angular2html
tar -xvzf go-ipfs_v0.8.0_darwin-amd64.tar.gz

> x go-ipfs/install.sh
> x go-ipfs/ipfs
> x go-ipfs/LICENSE
> x go-ipfs/LICENSE-APACHE
> x go-ipfs/LICENSE-MIT
> x go-ipfs/README.md
```

3. 执行安装

```angular2html
cd go-ipfs
bash install.sh

> Moved ./ipfs to /usr/local/bin
```

4. 检查安装结果

```angular2html
ipfs --version

> ipfs version 0.8.0
```

## IPFS 初始化及启动

1. 初始化 ipfs

```angular2html
ipfs init

> initializing ipfs node at /Users/jbenet/.ipfs
> generating 2048-bit RSA keypair...done
> peer identity: Qmcpo2iLBikrdf1d6QU6vXuNb6P7hwrbNPW9kLAH8eG67z
> to get started, enter:
>
>   ipfs cat /ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme
```

- peer identity : 每个 ipfs 节点都有一个独有的 id

2. 启动

```angular2html
ipfs daemon
> Initializing daemon...
> API server listening on /ip4/127.0.0.1/tcp/5001
> Gateway server listening on /ip4/127.0.0.1/tcp/8080
```

3. IPFS Web console  
   在浏览器中输入地址 localhost:5001/webui 查看 IPFS 控制台

## 测试 IPFS 和 ERC721

1. 安装相关依赖

    ```bash
    yarn install 或者 npm install
    ```

2. 配置私钥和网络：

   windows:

   ```bash
   copy .env.example .env
   ```

   linux:

   ```bash
   cp  .env.example .env
   ```

   在 `.env` 文件中填写私钥和 infura 节点

   ```js
   PRIVATE_KEY = xxxxxxxxxxxxxxxx; // 替换为你的私钥
   INFURA_ID = yyyyyyyy; // 替换为infura节点
   ```

3. 执行如下命令

```angular2html
npx hardhat run scripts/deploy-ipfs.js --network goerli
```

运行结束后，在 console 输出的日志中，最后一行打印出了你上传文件独有的 hash

```bash
> ...
> IPFS URL of art.jpg is : /ipfs/${FILE_HASH}$
```

4. 对比文件  
   在当前目录下执行如下命令，其中 _${FILE_HASH}$_ 在第二步中获得

```bash
ipfs cat /ipfs/${FILE_HASH}$ > art2.jpg
```

之后，可以对比下 art.jpg 和 art2.jpg 文件显示的内容是否一致

## 合约

合约参考 open-zeppelin  
修改项目: mintWithTokenURI 新增方法，任何人可以发发行 nft。

合约拍平

```bash
npx hardhat flatten ./contracts/MYERC721.sol > MYERC721.sol
```

## 参考文档

- https://docs.ipfs.io/install/command-line/#official-distributions
- https://mp.weixin.qq.com/s/3DshdSAzifyP9-CQZ-ORfw
