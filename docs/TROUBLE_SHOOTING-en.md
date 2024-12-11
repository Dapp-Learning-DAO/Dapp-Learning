## Common problem

- When installing front-end dependencies, If NPM or YARN is changed to a domestic source, Still a similar ` getaddrinfo ENOENT raw.githubusercontent.com ` error, consider setting up a proxy for it：

    ```shell
    npm config set proxy http://username:password@server:port
    npm config set https-proxy http://username:password@server:port
    ```

    For example：(To set the proxy for YARN, replace the NPM with YARN and the port with the port of the local proxy.)

    ```shell
    npm config set proxy http://127.0.0.1:2802
    npm config set https-proxy http://127.0.0.1:2802
    ```

## **Testnet Faucet Application**

### **Ethereum Testnet Comparison Analysis**

Ethereum test networks are designed to provide developers with environments for experimentation and testing. Each testnet differs in consensus mechanism, use case, design objectives, and resource allocation. Below is a detailed comparison of Rinkeby, Kovan, Ropsten, Goerli, Holesky, and Sepolia.

#### **1. Rinkeby**
- **Launch Date**: 2017  
- **Consensus Mechanism**: Proof of Authority (POA)  
- **Features**:
  - Relies on designated validators to run nodes, enabling faster transaction confirmation.
  - Stable network but with low decentralization.
  - Suitable for scenarios requiring rapid testing.  
- **Current Status**: Gradually deprecated; no longer recommended for new projects.

---

#### **2. Kovan**
- **Launch Date**: 2017  
- **Consensus Mechanism**: Proof of Authority (POA)  
- **Features**:
  - Created by the Parity team, offering fast synchronization and stable performance.
  - Nodes require permission to operate, limiting participants.
  - Suitable for permissioned chains and private development environments.  
- **Current Status**: Deprecated; developers have migrated to other networks.

---

#### **3. Ropsten**
- **Launch Date**: 2016  
- **Consensus Mechanism**:
  - Initially: Proof of Work (POW).
  - Later: Transitioned to Proof of Stake (POS) to simulate the Ethereum mainnet shift.  
- **Features**:
  - The testnet most similar to the mainnet, supporting comprehensive testing and contract deployment.
  - Allowed mining to obtain test tokens, offering some decentralization.
  - High operational costs and slower synchronization due to POW mechanism.  
- **Current Status**: Deprecated since late 2022.

---

#### **4. Goerli**
- **Launch Date**: 2019  
- **Consensus Mechanism**: Proof of Authority (POA), later transitioned to Proof of Stake (POS).  
- **Features**:
  - Multi-client support with strong compatibility, ideal for cross-client development.
  - Test tokens (GoETH) are limited and require faucets or requests, potentially causing bottlenecks.
  - Widely used for smart contract testing and validation.  
- **Current Status**: Deprecated.

---

#### **5. Holesky**
- **Launch Date**: 2023  
- **Consensus Mechanism**: Proof of Stake (POS)  
- **Features**:
  - Designed for Ethereum staking and protocol upgrade testing with high performance.
  - Provides a large supply of test tokens, addressing the limitations of Goerli tokens.
  - Suitable for complex testing needs for developers and validators.  
- **Current Status**: Emerging as a potential replacement for Goerli, aiming to support broader ecosystem needs.

---

#### **6. Sepolia**
- **Launch Date**: October 2021  
- **Consensus Mechanism**: Initially Proof of Work (POW), later transitioned to Proof of Stake (POS).  
- **Features**:
  - Designed specifically for developers, offering a precise testing environment for smart contracts and decentralized applications (dApps).
  - Equipped with fast synchronization and a permissioned validator set for efficient operations.
  - Unlimited test tokens (SepETH) ensure developers are not constrained by token shortages, resolving Goerli’s major issue.
  - Positioned as Ethereum’s primary development test network for the future.  
- **Current Status**: Regarded as one of the top choices for developers.

---

### **Comparison Summary**

| Testnet   | Consensus Mechanism | Token Acquisition    | Features                                  | Current Status    | 
|-----------|---------------------|----------------------|-------------------------------------------|-------------------|
| **Rinkeby** | POA                | Free Faucet          | Fast but lacks decentralization           | Deprecated        |
| **Kovan**   | POA                | Free Faucet          | Stable, requires permission to operate    | Deprecated        |
| **Ropsten** | POW → POS         | Mining or Faucet     | Closest to mainnet, supports full testing | Deprecated        |
| **Goerli**  | POA → POS         | Limited (Request)    | Strong compatibility, limited test tokens | Deprecated        |
| **Holesky** | POS               | Unlimited            | For complex testing, resource-rich        | Emerging Network  |
| **Sepolia** | POW → POS         | Unlimited            | Efficient, precise, developer-friendly    | Recommended       |

---

### **Faucet Links**

#### **Holesky Testnet**  
- [Stakely Faucet](https://stakely.io/faucet/ethereum-holesky-testnet-eth)  
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/holesky)  
- [PK910 Faucet](https://holesky-faucet.pk910.de/)  

#### **Sepolia Testnet**  
- [QuickNode Faucet](https://faucet.quicknode.com/base/sepolia)  
- [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)  