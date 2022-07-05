## 介绍

本章节用于演示Rust库 [rust-web3](https://github.com/tomusdrw/rust-web3) 的基础用法.

此项目包含两个文件夹, 在hardhat文件夹用于启动本地测试节点, web3-rust 为示例代码.


## 操作步骤

### hardhat 启动

#### 进入文件夹
```
cd hardhat
cp .env.example .env
```

#### 配置私钥
在 .env 中放入的 如下配置，格式如下:

```
PRIVATE_KEY=xxxxxxxxxxxxxxxx
INFURA_ID=yyy
```

#### 编译合约
```
yarn && yarn compile
```
> 因为我们在这里配置了新的插件 [hardhat-abi-exporter](https://github.com/ItsNickBarry/hardhat-abi-exporter) , 使我们可以在编译合约的同时, 在data文件夹下生成对应的abi文件

#### 启动本地测试网络

```
npx hardhat node
```
#### 部署测试合约到本地节点
```
npx hardhat run --network localhost ./scripts/sample-script.js
```

### web3-rust 启动
#### 进入文件夹
```
cd web3-rust
```

#### 运行程序  
** 如果还未安装Rust, 请参照 [官方文档](https://www.rust-lang.org/learn/get-started) 进行安装. **

```
cargo run
```

## 参考文档

- github 样例: <https://github.com/tomusdrw/rust-web3>
- web3 rust API: <https://docs.rs/web3/0.17.0/web3/>
- ethereum 官方 rust 参考文档: <https://ethereum.org/en/developers/docs/programming-languages/rust/>
