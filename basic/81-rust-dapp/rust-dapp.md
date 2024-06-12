## Outline

本文旨在介绍如何使用 Rust 与链上合约进行交互，进而开发 DApp。

## 1. 生成 bind 文件

首先，我们需要生成一个 bind 文件，用于将 Rust 代码与合约进行绑定。此处推荐使用 foundry 工具链，关于 foundry 的使用方法可以参考[foundry](https://book.getfoundry.sh/) 以及[41-foundry](../41-foundry/README.md)。

在项目根目录下执行如下命令：

```bash
forge bind --skip-cargo-toml --select ${CONTRACT_NAME} --module
```

其中，`${CONTRACT_NAME}` 为合约名称。生成的 bind 文件默认位于 `out/bindings`。

## 2. 将 bind 文件引入 Rust 项目

在 Rust 项目中引入 bind 文件，以便与合约进行交互。以此项目为例，将生成的文件放入`src/abi`目录下，并在 `Cargo.toml` 中添加如下依赖：

```toml
[dependencies]
ethers = { version = "2.0.14", features = ["abigen"] }
serde = { version = "1.0.203", features = ["derive"] }
```

## 3. 配置`.env`文件

在`.env`文件中添加必要的配置，包括且不限于：

- `RPC_URL`：节点 RPC 地址
- `PRIVATE_KEY`：私钥

## 4. 编写 Rust 代码

在 Rust 项目中，我们可以通过如下代码（`main.rs`)`与合约进行交互：

1. 导入必要的依赖

   ```rust
   use ethers::prelude::*;
   use std::convert::TryFrom;
   use std::env;
   use std::sync::Arc;
   use dotenv::dotenv;

   mod abi;
   use abi::*;
   ```

2. 初始化环境
   ```rust
   #[tokio::main]
   async fn main() -> Result<(), Box<dyn std::error::Error>> {
       dotenv().ok();
       env_logger::init();
       ...
   }
   ```
3. 读取`.env`文件中的配置
   ```rust
   let rpc_url = env::var("RPC_URL")?;
   let private_key = env::var("PRIVATE_KEY")?;
   ```
4. 初始化 Provider
   ```rust
   let provider = Provider::<Http>::try_from(rpc_url)?;
   let wallet  = private_key.parse::<LocalWallet>()?;
   let client = SignerMiddleware::new(provider, wallet);
   let client = Arc::new(client);
   ```
5. 创建合约实例

   ```rust
   let contract_address = "0xapple".parse::<Address>()?;
   let erc20_contract = erc20::ERC20::new(contract_address, client.clone());
   ```

6. 调用合约方法
   ```rust
   let to = "0xbeef".parse::<Address>()?;
   let amount = U256::from(100u64);
   erc20_contract.transfer(to, amount).await?;
   ```
