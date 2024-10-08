[中文](./README-CN.md) / English

## Introduction of IPFS

It is designed to create persistent and distributed storage and shared files. It is a content-address

Nodes in IPFS network build a distributed file system. It is an open source project developed since 2014 by protocol Lab with the help of the open source community and originally designed by Juan Benet.
IPFS is an equal distributed file system that tries to connect the same file system for all computing devices. In some ways, IPFS is similar to WWW.com and can also be regarded as an independent BitTorrent group and exchanged objects in the same Git warehouse. In other words, IPFS provides a high throughout, a block storage model with content addressing and related hyperlinks. This form a broad Merkle with a ringless chart(DAG).

IPFS combines distributed scattered lists, encouraging block exchange, and a self-certified name space.IPFS has no singlepoint failure, and nodes do not need to trust each other.Distributed content transmission can save bandwidth and prevent the HTTP scheme from DDOS attacks that may encounter.

This file system can be accessed in multiple ways, including Fuse and HTTP.Adding local files to the IPFS file system can make it available to the world.The file indicates that it is based on its hash, so it is conducive to cache.The distribution of the file adopts a BitTorrent protocol.Other users who look at the content also help to provide the content to the others on the Internet.
IPFS has a name service called IPNS. It is a global name space based on PKI, which is used to build a trust chain. This is compatible with other NS and can map DNS, .onion, .bit and more to IPNS.

<!-- todo 1155 left -->

## IPFS Installation

IPFS has multiple ways:

- IPFS Desktop: Direct running applications for everyone
- Command-line: The cli installation mode is selected. The following uses the MAC installation mode as an example. For other installation modes, refer to the documentation

1. Download files

```bash
wget https://dist.ipfs.io/go-ipfs/v0.8.0/go-ipfs_v0.8.0_darwin-amd64.tar.gz
```

2. Unzip

```angular2html
tar -xvzf go-ipfs_v0.8.0_darwin-amd64.tar.gz

> x go-ipfs/install.sh
> x go-ipfs/ipfs
> x go-ipfs/LICENSE
> x go-ipfs/LICENSE-APACHE
> x go-ipfs/LICENSE-MIT
> x go-ipfs/README.md
```

3. Install

```angular2html
cd go-ipfs
bash install.sh

> Moved ./ipfs to /usr/local/bin
```

4. Checking the Installation Result

```angular2html
ipfs --version

> ipfs version 0.8.0
```

## IPFS Initialization and startup

1. Initialize ipfs

```angular2html
ipfs init

> initializing ipfs node at /Users/jbenet/.ipfs
> generating 2048-bit RSA keypair...done
> peer identity: Qmcpo2iLBikrdf1d6QU6vXuNb6P7hwrbNPW9kLAH8eG67z
> to get started, enter:
>
>   ipfs cat /ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme
```

- peer identity : Each IPFS node has a unique id

2. Startup

```angular2html
ipfs daemon
> Initializing daemon...
> API server listening on /ip4/127.0.0.1/tcp/5001
> Gateway server listening on /ip4/127.0.0.1/tcp/8080
```

3. IPFS Web console  
   Enter the address LocalHost: 5001/WebUI to view the IPFS console

## Test IPFS and ERC721

1. Installation-dependent dependencies

   ```bash
   yarn install or npm install

    #Node 版本： v20.11.0
   ```

2. Configure private key and network

   windows:

   ```bash
   copy .env.example .env
   ```

   linux:

   ```bash
   cp  .env.example .env
   ```

   Enter private key in `.env` file and infura node

   ```js
   PRIVATE_KEY = xxxxxxxxxxxxxxxx; // your private key
   INFURA_ID = yyyyyyyy; // infura node
   ```

3. Run the following command

```angular2html
npx hardhat run scripts/deploy-ipfs.js --network goerli
```

After running, the last line of the console log prints the hash unique to the file you uploaded

```bash
> ...
> IPFS URL of art.jpg is : /ipfs/${FILE_HASH}$
```

4. 对比文件  
   run the following command in the current directory, _${FILE_HASH}$_ accessed in second step

```bash
ipfs cat /ipfs/${FILE_HASH}$ > art2.jpg
```

art.jps and art2.jps can be compared to see if the contents displayed are the same.

## Contracts

Contract reference open-zeppelin
Modify project: mintWithTokenURI added method，anyone can publish nft。

Contract flatten

```bash
npx hardhat flatten ./contracts/MYERC721.sol > MYERC721.sol
```

## References

- https://docs.ipfs.io/install/command-line/#official-distributions
- https://mp.weixin.qq.com/s/3DshdSAzifyP9-CQZ-ORfw
