中文 / [English](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/docs/TROUBLE_SHOOTING-en.md)

## 常见问题

- 安装前端依赖时，如果在 npm 或者 yarn 修改为国内源之后，依旧出现类似 `getaddrinfo ENOENT raw.githubusercontent.com` 的报错，可以考虑为其设置代理：

    ```shell
    npm config set proxy http://username:password@server:port
    npm config set https-proxy http://username:password@server:port
    ```

    例如：（要为yarn设置代理将其中的npm替换为yarn即可，端口需要替换为本地代理的端口）

    ```shell
    npm config set proxy http://127.0.0.1:2802
    npm config set https-proxy http://127.0.0.1:2802
    ```

- Cannot read property 'toHexString'  
执行测试脚本时, 报类似如下的错误, 说明没有正确配置私钥, 需要重命名 .env.example 文件为 .env 文件, 然后在 .env 文件中配置私钥

```shell
TypeError: Cannot read property 'toHexString' of undefined
    at isHexable (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/bytes/lib/index.js:9:21)
    at hexlify (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/bytes/lib/index.js:175:9)
    at new SigningKey (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/signing-key/lib/index.js:20:82)
    at new Wallet (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/wallet/lib/index.js:123:36)
    at Object.<anonymous> (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/index.js:39:14)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
    at Module.load (internal/modules/cjs/loader.js:950:32)
    at Function.Module._load (internal/modules/cjs/loader.js:790:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:76:12)
```

## **测试币申请 testnet**  

### **以太坊测试网的对比分析**

以太坊的测试网络旨在为开发者提供实验和测试的环境，不同的测试网在共识机制、使用场景、设计目标和资源分配上各有特点。以下是 Rinkeby、Kovan、Ropsten、Goerli、Holesky 和 Sepolia 的详细区别和分析。

#### **1. Rinkeby**
- **推出时间**：2017 年
- **共识机制**：Proof of Authority (POA)
- **特点**：
  - 依赖于指定验证者运行节点，具有更高的交易确认速度。
  - 网络稳定，但去中心化程度低。
  - 适用于开发者需要快速测试的场景。
- **现状**：已逐步停用，不再推荐新项目使用。



#### **2. Kovan**
- **推出时间**：2017 年
- **共识机制**：Proof of Authority (POA)
- **特点**：
  - 由 Parity 技术团队创建，支持快速同步和稳定性能。
  - 运行的节点必须经过许可，因此参与者有限。
  - 适用于权限链和专属开发环境。
- **现状**：已停用，开发者逐渐迁移到其他网络。



#### **3. Ropsten**
- **推出时间**：2016 年
- **共识机制**：
  - 初期：Proof of Work (POW)
  - 后期：转为 Proof of Stake (POS)，模拟以太坊主网过渡。
- **特点**：
  - 是最接近主网的测试网，支持主网功能测试和合约部署。
  - 支持挖矿获取测试币，具有一定的去中心化特性。
  - 运行成本较高，且 POW 机制带来较慢的同步速度。
- **现状**：2022 年底已停用。



#### **4. Goerli**
- **推出时间**：2019 年
- **共识机制**：Proof of Authority (POA)，后转为 Proof of Stake (POS)
- **特点**：
  - 多客户端支持，兼容性强，适合作为跨客户端的开发环境。
  - 测试币（GoETH）供应有限，开发者需通过水龙头或请求获取，可能成为瓶颈。
  - 被广泛用于智能合约测试和验证。
- **现状**：已停用。



#### **5. Holesky**
- **推出时间**：2023 年
- **共识机制**：Proof of Stake (POS)
- **特点**：
  - 专为以太坊质押和协议升级测试设计，具有较高的性能。
  - 提供大量测试币，弥补 Goerli 测试币不足的问题。
  - 适合开发者和验证者的复杂测试需求。
- **现状**：是 Goerli 的潜在替代网络，目标是承载更广泛的生态需求。



#### **6. Sepolia**
- **推出时间**：2021 年 10 月
- **共识机制**：初期为 Proof of Work (POW)，后转为 Proof of Stake (POS)
- **特点**：
  - 专为开发者设计，作为智能合约和去中心化应用 (dApp) 的精准测试环境。
  - 配备快速同步机制，验证者组采用许可模式，保证高效运行。
  - 无限测试币（SepETH）供应，无需担心测试币短缺问题，解决了 Goerli 的主要缺点。
  - 是以太坊未来的主要开发测试网络。
- **现状**：被视为开发者最优选的测试网络之一。


### **对比总结**

| 测试网   | 共识机制         | 测试币获取          | 特点                                   | 现状             | 
|----------|------------------|---------------------|----------------------------------------|------------------|
| **Rinkeby** | POA              | 免费水龙头          | 快速但去中心化低                       | 已停用           |
| **Kovan**   | POA              | 免费水龙头          | 性能稳定，需许可运行                   | 已停用           |
| **Ropsten** | POW → POS       | 可挖矿或水龙头      | 接近主网，支持全面测试                 | 已停用           |
| **Goerli**  | POA → POS       | 有限（需请求获取）   | 跨客户端兼容性强，但测试币有限         | 已停用        |
| **Holesky** | POS              | 无限测试币          | 面向复杂协议测试，资源丰富             | 新兴网络，潜力大 |
| **Sepolia** | POW → POS       | 无限测试币          | 高效，精准，为开发者优化               | 推荐使用         |

#### **Holesky领水地址**  
- [Stakely Faucet](https://stakely.io/faucet/ethereum-holesky-testnet-eth)  
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/holesky)  
- [PK910 Faucet](https://holesky-faucet.pk910.de/)  

#### **Sepolia领水地址**  
- [QuickNode Faucet](https://faucet.quicknode.com/base/sepolia)  
- [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)  


