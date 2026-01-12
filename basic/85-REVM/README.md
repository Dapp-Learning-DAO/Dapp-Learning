# REVM 

本项目基于 [REVM Is All You Need](https://medium.com/@solidquant/revm-is-all-you-need-e01b5b0421e4) 的示例代码，并进行了现代化改造，此项目目前实现了：

- 使用 Alloy 替代 ethers v1，提供更好的类型安全
- 采用异步架构和 tokio 运行时
- 使用 anyhow 进行统一错误处理
- 优化了代码结构和 API 设计

## 项目概述

REVM (Rust Ethereum Virtual Machine) 是一个用 Rust 编写的高性能以太坊虚拟机实现，提供了完整的 EVM 功能，包括交易执行、状态管理、合约部署等。本项目展示了如何使用 REVM 进行各种以太坊操作，包括代币余额查询、交易模拟、Uniswap V2 交换等。

### 主要特性

- **高性能**: 基于 Rust 实现，提供卓越的执行性能
- **现代化**: 使用最新的 Alloy 和 REVM 库
- **功能完整**: 支持完整的 EVM 操作和调试功能
- **易于使用**: 提供简洁的 API 和丰富的示例

## 项目结构

```
src/
├── main.rs              # 主程序入口
├── lib.rs               # 库定义和类型别名
├── constants.rs         # 常量定义和环境配置
├── revm_examples.rs     # REVM 核心功能示例
├── eth_call_examples.rs # eth_call 相关示例
├── tokens.rs            # 代币相关功能
├── trace.rs             # 交易追踪功能
└── utils.rs             # 工具函数
```

## 核心功能

### 1. EVM 实例创建

```rust
// 创建带有 AlloyDB 的 EVM 实例
pub async fn create_evm_instance(rpc_url: &str) -> Result<NewEvm> {
    let provider = ProviderBuilder::new().connect(rpc_url).await?.erased();
    let alloy_db = WrapDatabaseAsync::new(AlloyDB::new(provider, BlockId::latest())).unwrap();
    let cache_db = AlloyCacheDB::new(alloy_db);
    let evm = Context::mainnet().with_db(cache_db).build_mainnet();
    Ok(evm)
}
```

**功能说明**:
- 连接到以太坊 RPC 节点
- 创建 AlloyDB 数据库包装器
- 构建主网环境的 EVM 实例
- 支持缓存机制提高性能

### 2. 代币余额查询

```rust
pub fn get_token_balance(evm: &mut NewEvm, token: H160, account: H160) -> Result<U256> {
    let erc20_abi = BaseContract::from(parse_abi(&[
        "function balanceOf(address) external view returns (uint256)",
    ])?);
    let calldata = erc20_abi.encode("balanceOf", account)?;

    evm.tx.caller = Address::from_slice(&account.0);
    evm.tx.kind = TxKind::Call(Address::from_slice(&token.0));
    evm.tx.data = rBytes::from(calldata.0);

    let result = evm.transact(evm.tx.clone())?;
    // 处理执行结果...
}
```

**功能说明**:
- 使用 ERC20 ABI 编码调用数据
- 设置交易环境（调用者、目标合约、数据）
- 执行交易并解码返回结果
- 支持错误处理和 gas 使用统计

### 3. 交易追踪和调试

```rust
pub async fn geth_and_revm_tracing(
    evm: &mut NewEvm,
    provider: DynProvider,
    token: H160,
    account: H160,
) -> Result<i32> {
    // 使用 Geth 的 PreStateTracer 获取状态变化
    let geth_trace = get_state_diff(provider, tx, block.number().into()).await?;
    
    // 分析存储槽变化
    for i in 0..20 {
        let slot = keccak256(&abi::encode(&[
            abi::Token::Address(account.into()),
            abi::Token::Uint(U256::from(i)),
        ]));
        
        if token_touched_storage.contains_key(&slot) {
            info!("Balance storage slot: {:?} (0x{:x})", i, H256::from(slot.0));
            return Ok(i);
        }
    }
    Ok(0)
}
```

**功能说明**:
- 使用 Geth 的调试 API 获取交易前的状态
- 分析存储槽访问模式
- 自动发现代币余额存储位置
- 支持多种存储布局模式

### 4. Uniswap V2 交换模拟

```rust
pub async fn revm_v2_simulate_swap(
    _evm: &mut NewEvm,
    provider: DynProvider,
    account: H160,
    factory: H160,
    target_pair: H160,
    input_token: H160,
    output_token: H160,
    input_balance_slot: i32,
    output_balance_slot: i32,
    input_token_implementation: Option<H160>,
    output_token_implementation: Option<H160>,
) -> Result<(U256, U256)> {
    // 创建新的 EVM 实例
    let alloy_db = WrapDatabaseAsync::new(AlloyDB::new(provider.clone(), BlockId::latest())).unwrap();
    let mut cache_db = AlloyCacheDB::new(alloy_db);
    let mut new_evm = Context::mainnet().with_db(cache_db).build_mainnet();

    // 设置用户账户
    let ten_eth = rU256::from(10).checked_mul(rU256::from(10).pow(rU256::from(18))).unwrap();
    let user_acc_info = AccountInfo::new(ten_eth, 0, keccak256(&[]), Bytecode::default());
    new_evm.journal_mut().database.insert_account_info(Address::from_slice(&account.0), user_acc_info);

    // 部署模拟器合约
    let simulator_address = H160::from_str("0xF2d01Ee818509a9540d8324a5bA52329af27D19E").unwrap();
    let simulator_acc_info = AccountInfo::new(
        rU256::ZERO,
        0,
        keccak256(&[]),
        Bytecode::new_raw(rBytes::from(SIMULATOR_CODE.0.to_vec())),
    );
    new_evm.journal_mut().database.insert_account_info(
        Address::from_slice(&simulator_address.0),
        simulator_acc_info,
    );

    // 执行交换模拟
    let amount_in = U256::from(1).checked_mul(U256::from(10).pow(U256::from(18))).unwrap();
    let simulator_abi = BaseContract::from(parse_abi(&[
        "function v2SimulateSwap(uint256,address,address,address) external returns (uint256, uint256)",
    ])?);
    
    let calldata = simulator_abi.encode(
        "v2SimulateSwap",
        (amount_in, target_pair, input_token, output_token),
    )?;

    // 执行交易并返回结果
    let result = new_evm.transact(tx)?;
    let out: (U256, U256) = simulator_abi.decode_output("v2SimulateSwap", result.output)?;
    Ok(out)
}
```

**功能说明**:
- 创建独立的 EVM 环境进行模拟
- 部署模拟器合约执行交换逻辑
- 设置代币余额和流动性池状态
- 返回交换结果和 gas 使用量

### 5. 代理合约检测

```rust
pub async fn get_implementation(
    provider: DynProvider,
    token: H160,
) -> Result<Option<H160>> {
    // 检查多种代理模式
    let eip_1967_logic_slot: U256 = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc".parse().unwrap();
    let eip_1967_beacon_slot: U256 = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50".parse().unwrap();
    let open_zeppelin_implementation_slot: U256 = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3".parse().unwrap();
    let eip_1822_logic_slot: U256 = "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7".parse().unwrap();

    let implementation_slots = vec![
        eip_1967_logic_slot,
        eip_1967_beacon_slot,
        open_zeppelin_implementation_slot,
        eip_1822_logic_slot,
    ];

    // 并发检查所有存储槽
    let mut set = JoinSet::new();
    for slot in implementation_slots {
        let _provider = provider.clone();
        let fut = tokio::spawn(async move {
            _provider.get_storage_at(Address::from_slice(&token.0), slot).await
        });
        set.spawn(fut);
    }

    while let Some(res) = set.join_next().await {
        let out = res???;
        let implementation = H160::from_slice(&out.to_be_bytes::<32>()[12..]);
        if implementation != *ZERO_ADDRESS {
            return Ok(Some(implementation));
        }
    }
    Ok(None)
}
```

**功能说明**:
- 支持多种代理合约标准（EIP-1967, EIP-1822, OpenZeppelin）
- 并发检查多个存储槽提高效率
- 自动检测实现合约地址
- 处理不同的代理模式

## 使用示例

### 基本设置

```rust
use revm_is_all_you_need::{
    create_evm_instance, evm_env_setup, get_token_balance,
    geth_and_revm_tracing, revm_v2_simulate_swap
};

#[tokio::main]
async fn main() -> Result<()> {
    // 设置环境
    let env = Env::new();
    let mut evm = create_evm_instance(&env.wss_url).await?;
    evm_env_setup(&mut evm);

    // 查询代币余额
    let user = H160::from_str("0xE2b5A9c1e325511a227EF527af38c3A7B65AFA1d").unwrap();
    let weth = H160::from_str("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2").unwrap();
    
    match get_token_balance(&mut evm, weth, user) {
        Ok(balance) => println!("WETH balance: {}", balance),
        Err(e) => println!("Balance query failed: {}", e),
    }

    Ok(())
}
```

### 交换模拟

```rust
// 模拟 Uniswap V2 交换
let uniswap_v2_factory = H160::from_str("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f").unwrap();
let weth_usdt_pair = H160::from_str("0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852").unwrap();

let result = revm_v2_simulate_swap(
    &mut evm,
    provider,
    user,
    uniswap_v2_factory,
    weth_usdt_pair,
    weth,
    usdt,
    weth_balance_slot,
    usdt_balance_slot,
    weth_implementation,
    usdt_implementation,
).await?;

println!("Swap result: {:?}", result);
```

## 环境配置

创建 `.env` 文件：

```env
HTTPS_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
WSS_URL=wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
```

## 依赖项

主要依赖包括：

- `revm`: 核心 EVM 实现
- `alloy`: 现代化的以太坊库
- `ethers`: 以太坊交互库
- `tokio`: 异步运行时
- `anyhow`: 错误处理

## 高级功能

### 1. 状态覆盖

REVM 允许在交易执行前覆盖特定状态：

```rust
// 设置用户余额
let user_acc_info = AccountInfo::new(ten_eth, 0, keccak256(&[]), Bytecode::default());
evm.journal_mut().database.insert_account_info(user_address, user_acc_info);

// 设置存储槽值
evm.db_mut().insert_account_storage(
    token_address,
    storage_slot,
    new_value,
)?;
```

### 2. 合约部署

```rust
// 部署合约
let contract_code = Bytecode::new_raw(rBytes::from(bytecode));
let contract_info = AccountInfo::new(
    rU256::ZERO,
    0,
    keccak256(&[]),
    contract_code,
);
evm.journal_mut().database.insert_account_info(contract_address, contract_info);
```

### 3. 交易追踪

```rust
// 使用 Geth 调试 API
let trace = provider.debug_trace_call(
    tx,
    block_number,
    GethDebugTracingCallOptions {
        tracing_options: GethDebugTracingOptions {
            tracer: Some(GethDebugTracerType::BuiltInTracer(
                GethDebugBuiltInTracerType::PreStateTracer,
            )),
            ..Default::default()
        },
        ..Default::default()
    },
).await?;
```

## 性能优化

1. **缓存机制**: 使用 `CacheDB` 减少重复的数据库查询
2. **并发处理**: 使用 `JoinSet` 并发执行多个操作
3. **内存管理**: 合理使用 `InMemoryDB` 进行快速测试
4. **Gas 优化**: 设置合适的 gas 限制和价格

## 错误处理

项目使用 `anyhow` 进行统一的错误处理：

```rust
use anyhow::{anyhow, Result};

fn example_function() -> Result<()> {
    let result = some_operation()?; // 自动错误传播
    Ok(())
}
```

## 测试

运行测试：

```bash
cargo test
```

运行示例：

```bash
cargo run
```

## 许可证

MIT License

## 参考链接

- [REVM Is All You Need - Medium 文章](https://medium.com/@solidquant/revm-is-all-you-need-e01b5b0421e4)
- [REVM GitHub 仓库](https://github.com/bluealloy/revm)
- [Alloy 文档](https://alloy.rs/)
- [Ethers.rs 文档](https://docs.rs/ethers/)