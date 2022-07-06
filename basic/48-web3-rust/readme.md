## 介绍

本章节用于演示Rust库 [rust-web3](https://github.com/tomusdrw/rust-web3) 的基础用法.


## 操作步骤

### 启动本地节点

#### 初始化hardhat

```
// 创建一个空文件夹
mkdir hardhat && cd hardhat
// 初始化
npx hardhat
```

#### 启动本地测试网络

```
npx hardhat node
```
#### 部署测试合约到本地节点
新启动命令行
```
npx hardhat run --network localhost ./scripts/sample-script.js
```

### web3-rust 启动

### 配置私钥
```
cp .env.example .env
```
在 .env 中放入 如下配置，格式如下:

```
TARGET_NETWORK=http://localhost:8545
```

#### 运行程序  
** 如果还未安装Rust, 请参照 [官方文档](https://www.rust-lang.org/learn/get-started) 进行安装 **  

```
cargo run
```

## 参考文档

- github 样例: <https://github.com/tomusdrw/rust-web3>
- web3 rust API: <https://docs.rs/web3/0.17.0/web3/>
- ethereum 官方 rust 参考文档: <https://ethereum.org/en/developers/docs/programming-languages/rust/>
