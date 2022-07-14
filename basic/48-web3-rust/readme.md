## 介绍

本章节用于演示Rust库 [rust-web3](https://github.com/tomusdrw/rust-web3) 的基础用法.


## 操作步骤

### 启动本地节点

#### 初始化hardhat

```
cd hardhat && yarn
```

#### 配置 .env

```sh
cp .env.example .env
## 修改 .env 中的 INFURA_ID 和 PRIVATE_KEY 为实际的值
PRIVATE_KEY=xxxxxxxxxxxxxxxx
```

#### 启动本地测试网络

```
npx hardhat node --network hardhat
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
CONTRACT_ADDR=0xAAAA  
MY_ACCOUNT=0xaaaaaaaa
TEST_ADDR=0xd028d24f16a8893bd078259d413372ac01580769
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
