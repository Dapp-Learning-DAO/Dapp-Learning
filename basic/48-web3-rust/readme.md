## 介绍

本章节用于演示Rust库 [rust-web3](https://github.com/tomusdrw/rust-web3) 的基础用法.


## 操作步骤

#### 初始化hardhat

```
cd hardhat && yarn
```

#### 生成 rust 所需的 abi 和 code 文件

```
npx hardhat run ./scripts/file-generate.js
```

#### 配置 .env

```sh
cp .env.example .env
## 修改 .env 中的 INFURA_ID 和 PRIVATE_KEY 为实际的值
PRIVATE_KEY=xxxxxxxxxxxxxxxx
ACCOUNT_BALANCE=10000000000000000000000
```

#### 启动本地测试网络

```
npx hardhat node --network hardhat
```

### web3-rust 启动

### 配置私钥
```
cp .env.example .env
```
在 .env 中放入 如下配置，格式如下:
`TARGET_NETWORK` 为想要部署合约的网络, 示例中为hardhat本地网络
```
TARGET_NETWORK=http://localhost:8545  
MY_ACCOUNT=0xaaaaaaaa
TEST_ADDR=0xd028d24f16a8893bd078259d413372ac01580769
```

> ##### 要使用已部署的合约

  1. 在 .evn 中加入

  ```
  CONTRACT_ADDR=0xAAAA  
  ```

  2. 去除 main.rs 这部分的注释, 并且将先前声明的 `contract_addr` 变量删除或者注释
  ```
  // Given contract address, we need this to generate Contract instance
  let addr = dotenv!("CONTRACT_ADDR").replace("0x", "");
  println!("current account: {}", dotenv!("CONTRACT_ADDR"));
  let contract_addr: H160 = H160::from(<[u8; 20]>::from_hex(addr).expect("Decoding failed"));
  ```

#### 运行程序  
** 如果还未安装Rust, 请参照 [官方文档](https://www.rust-lang.org/learn/get-started) 进行安装 **  

```
cargo run
```

## 参考文档

- rust语言圣经： https://course.rs/basic/variable.html
- rust 官方学习文档: <https://doc.rust-lang.org/book/>
- esay rust : <https://github.com/Dhghomon/easy_rust>
- rust 小测验 : <https://github.com/rust-lang/rustlings>  
- github 样例: <https://github.com/tomusdrw/rust-web3>
- web3 rust API: <https://docs.rs/web3/0.17.0/web3/>
- ethereum 官方 rust 参考文档: <https://ethereum.org/en/developers/docs/programming-languages/rust/>
