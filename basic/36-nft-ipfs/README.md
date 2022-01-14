# 简介

数据存储在 ipfs 上后, 在 Dapp 前端就可以通过 api 进行访问, 达到去中心化的目的.
我们可以使用两种方式进行
//todo
FileCoin

## 测试 nft.storage 流程

- 账户注册  
  注册https://nft.storage/, 获得 nft.storage API Key, 写入.env
- 安装 nft.storage 以及其他依赖

```shell
npm install
```

- 运行 js 文件

```shell
node scripts/nftStorage-uploadfile
```

## 测试 ipfs.infura 流程

- 在 infura 上创建 ipfs 工程  
  登陆 infura, 然后进入 Dashboard, 之后在 "IPFS" 标签页中创建 IPFS 工程
  <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/36-nft-ipfs/ipfs-infura.png?raw=true" /></center>

- 获取 "PROJECT ID" 和 "PROJECT SECRET"  
  点击刚才创建的 IPFS 工程, 然后获取其中的 "PROJECT ID" 和 "PROJECT SECRET"

- 上传文件  
  替换如下命令中的 PROJECT_ID, PROJECT_SECRET.

```shell
cd data;
curl -X POST -F file=@matic.jpeg \
-u "<PROJECT_ID>:<PROJECT_SECRET>" \
"https://ipfs.infura.io:5001/api/v0/add"
```

之后可以看到如下输出:

```shell
{
      "Name":"ipfs_file_docs_getting_started_demo.txt",
      "Hash":"QmeGAVddnBSnKc1DLE7DLV9uuTqo5F7QbaveTjr45JUdQn",
      "Size":"44"
}
```

- 获取文件 && 验证  
  替换如下命令中的 Hash 参数, 然后执行如下命令, 之后检查 matic.jpeg 文件.

```shell
rm matic.jpeg
curl -X POST -u "PROJECT_ID:PROJECT_SECRET" \
"https://ipfs.infura.io:5001/api/v0/pin/add?arg=<Hash>" -o matic.jpeg
```

## 参考文档

- <https://www.bilibili.com/video/BV1j5411w7MH>
- <https://pinata.cloud/pinmanager>
- <https://nft.storage>
- https://infura.io/docs/ipfs#section/Authentication/Using-Javascript
