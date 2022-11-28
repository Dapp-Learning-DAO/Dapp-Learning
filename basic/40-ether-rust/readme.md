# ether-rs 

## 介绍
本章节用于演示 Rust 库 [ether-rs](https://github.com/gakonst/ethers-rs) 的基础用法.

## 操作步骤


### 配置 .env

```sh
cp .env.example .env
## 修改 .env 中的 INFURA_ID 和 PRIVATE_KEY 为实际的值
PRIVATE_KEY=xxxxxxxxxxxxxxxx
TEST_ACCOUNT_PRIVATE_KEY=xxxxxxxx
ACCOUNT_BALANCE=10000000000000000000000
```

## ether-rust 启动

### 配置私钥

```
cp .env.example .env
```

在 .env 中放入 如下配置，格式如下:
`TARGET_NETWORK` 为想要部署合约的网络, 示例中为 hardhat 本地网络

```
TARGET_NETWORK=http://localhost:8545
MY_ACCOUNT=0xaaaaaaaa
TEST_ADDR=0xd028d24f16a8893bd078259d413372ac01580769
```

**如果要使用已部署的合约**

1. 将 .evn 中的 `CONTRACT_ADDR` 变量改为以部署的合约地址

   ```bash
   CONTRACT_ADDR=0xAAAA
   ```
   
### 运行程序

**如果还未安装 Rust, 请参照 [官方文档](https://www.rust-lang.org/learn/get-started) 进行安装**。
**solc安装需要0.8.10以上，具体参考 https://github.com/gakonst/ethers-rs**

```bash
cargo run --bin ether1
```

## 参考文档

- rust 语言圣经： <https://course.rs>
- rust 官方学习文档: <https://doc.rust-lang.org/book/>
- easy rust : <https://github.com/Dhghomon/easy_rust>
- rust 小测验 : <https://github.com/rust-lang/rustlings>
- github 样例: <https://github.com/tomusdrw/rust-web3>
- web3 rust API: <https://docs.rs/web3/0.17.0/web3/>
- ethereum 官方 rust 参考文档: <https://ethereum.org/en/developers/docs/programming-languages/rust/>
- ethers-rs tutorial1 :https://coinsbench.com/ethereum-with-rust-tutorial-part-2-compile-and-deploy-solidity-contract-with-rust-c3cd16fce8ee 
- ethers-rs tutorial2: https://coinsbench.com/ethereum-with-rust-tutorial-part-2-compile-and-deploy-solidity-contract-with-rust-c3cd16fce8ee
-ether-rs code example: https://github.com/cl2089/rust-ethereum-tutorial/blob/main/src/contract_deploy.rs
- ether-rs test: https://github.com/gakonst/ethers-rs/blob/master/examples/contract_with_abi.rs
