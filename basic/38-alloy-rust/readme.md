## Outline

本文旨在介绍如何使用 Rust SDK([alloy-rs](https://github.com/alloy-rs/alloy)) 与链上合约进行交互，进而开发 DApp。

## 1. 配置`.env`文件

在`.env`文件中添加必要的配置，包括且不限于：

- `RPC_URL`：节点 RPC 地址
- `DEV_PRIVATE_KEY`：私钥

## 2. 编写 Rust 代码

在 Rust 项目中，我们可以通过如下代码（`main.rs`)与合约进行交互：

1. 导入必要的依赖

   ```rust
   use std::env;
   use alloy::{providers::ProviderBuilder, sol};
   use alloy::network::{EthereumWallet, NetworkWallet};
   use alloy::primitives::{U256};
   use alloy::providers::Provider;
   use alloy::signers::local::{PrivateKeySigner};
   use dotenv::dotenv;
   use eyre::Result;
   use log::info;
   ```

2. 引入合约 abi

   ```rust
   sol!(
       #[allow(missing_docs)]
       #[sol(rpc)]
       SimpleToken,
       "src/abi/SimpleToken.json"
   );
   ```

3. 初始化环境

   ```rust
   #[tokio::main]
   async fn main() -> Result<(), Box<dyn std::error::Error>> {
       dotenv().ok();
       env_logger::init();
       ...
   }
   ```

4. 读取`.env`文件中的配置

   ```rust
   let rpc_url = env::var("RPC_URL").parse()?;
   let private_key = env::var("PRIVATE_KEY")?;
   ```

5. 初始化 Wallet 和 Provider

   ```rust
   let signer: PrivateKeySigner = private_key.parse().expect("Failed to parse private key");
   let address = signer.address();
   let wallet = EthereumWallet::from(signer);
   let provider =
       ProviderBuilder::new().with_recommended_fillers().wallet(wallet).on_http(rpc_url);
   ```

6. 创建合约实例

   ```rust
   // 或者连接已有的合约
   // let erc20_contract = SimpleToken::new("0xapple".parse()?, provider);
   let erc20_contract = SimpleToken::deploy(provider).await?;
   ```

7. 调用合约方法

   ```rust
   let amount = U256::from(100u64);
   let receipt = erc20_contract.transfer(address, amount).send().await?.get_receipt().await?;

   assert_eq!(receipt.status(), true);
   info!("Transfer successful");
   ```
