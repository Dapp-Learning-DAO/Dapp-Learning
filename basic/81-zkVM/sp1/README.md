## SP1
SP1 是一个高性能的开源零知识虚拟机 (zkVM)，可验证任意 Rust（或任何 LLVM 编译语言）程序的执行情况。

## 安装
### 安装SP1 installer sp1up
```
curl -L https://sp1.succinct.xyz | bash

sp1up
```

sp1up会安装两个东西： succinct 和 cargo prove

## 创建一个 SP1 项目

创建一个新的SP1项目，包含 fibonacci示例。
```
cargo prove new fibonacci
cd fibonacci
```

也可以使用官方项目模板
[sp1-project-template](https://github.com/succinctlabs/sp1-project-template)

### 项目结构

```
├── contracts
│   ├── src
│   │   ├── Fibonacci.sol
│   └── test
│       └── Fibonacci.t.sol
├── program
│   ├── Cargo.lock
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── script
    └── src
        └── bin
            ├── evm.rs
            ├── main.rs
            └── vkey.rs
```

项目中有 3 个目录：

contracts: 基于 foundry 的solidity ZKP 验证合约目录。

program：将在 zkVM 中执行，需要进行 ZKP证明的程序源代码。

script：包含证明生成和验证代码的代码。其中evm.rs 用于与evm 链交互，main.rs 生成离线证明并验证。 vkey.rs 获取用于链上合约使用的“programVKey”。


### 生成证明
执行 zkVM，并生成 ZKP 证明 , 默认 --bin 参数位 main,  实际执行 script/src/bin/main.rs文件 

```
cd script
RUST_LOG=info cargo run --release -- --execute

RUST_LOG=info cargo run --release -- --prove
```

生成用于 evm 链上验证的证明, 实际执行 script/src/bin/evm.rs 文件


```
cargo run --release --bin evm
```

## 官方 Prover Network
Prover Network在多台机器上生成 SP1 证明，从而减少延迟，并在优化的硬件实例上运行 SP1，从而缩短证明生成时间并降低成本。

详情参考Prover Network 相关文档： https://docs.succinct.xyz/generating-proofs/prover-network.html 

## 相关链接
1. SP1官方文档。 https://docs.succinct.xyz/