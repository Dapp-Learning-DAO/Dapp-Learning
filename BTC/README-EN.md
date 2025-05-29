# Bitcoin (BTC)

This knowledge base aims to provide comprehensive information about Bitcoin (BTC) technology, covering basic functions, advanced applications, and various protocols and tools in the ecosystem. Whether you're a beginner or an experienced developer, this guide will help you better understand and use Bitcoin technology.

## Introduction

Bitcoin is the first decentralized digital currency based on blockchain technology, proposed by a person or team under the pseudonym "Satoshi Nakamoto" in 2008 and officially launched in 2009. It revolutionizes the traditional financial system by enabling trustless value transfer through cryptography and distributed networks. It serves as both a payment tool and investment vehicle, and is viewed as a social experiment redefining the boundaries of money and trust.

Bitcoin combines cryptography, economics, and distributed systems, pioneering decentralized digital assets. Its value stems from technical reliability (censorship resistance, scarcity), social consensus (the "digital gold" narrative), and macro environment (fiat currency inflation, geopolitical conflicts). Despite facing scaling bottlenecks, energy controversies, and regulatory uncertainties, Bitcoin continues to drive financial system reform, becoming a core symbol of the blockchain revolution and redefining the future of money, trust, and value.

## Core Technical Mechanisms

-Blockchain and Decentralization 
Transaction data is stored in a transparent distributed ledger (blockchain) maintained by global nodes without central control. Chain structure (blocks linked by hash values) and timestamp technology ensure data immutability.

-Cryptography and Security
Uses SHA-256 hash algorithm and asymmetric encryption (public key addresses and private key signatures) to ensure transaction ownership and security. Proof of Work (PoW): Miners compete with computing power to verify transactions and generate new blocks, exchanging energy consumption for network security while receiving new coins as rewards.

-Deflationary Model
Total supply capped at 21 million coins, with new coin issuance "halving" every four years, complete mining by 2140, scarcity comparable to gold.

## Core Features and Innovations

-Trustless
No need for bank or government endorsement, code rules drive system operation, users independently control assets (private key equals ownership).

-Censorship Resistance and Globalization 
Transactions unrestricted by borders, node network resistant to blocking, particularly suitable for cross-border payments and inflation hedging (e.g., El Salvador adopting as legal tender).

-Pseudonymity
Users transact via encrypted addresses without direct identity binding, but on-chain records are publicly traceable, requiring mixing tools for enhanced privacy.

-Irreversibility
Transactions once confirmed on blockchain cannot be reversed, reducing fraud risk but requiring careful operation (e.g., mistaken transfers cannot be recovered).

-High Volatility
Market supply/demand, policy regulation and speculative sentiment cause dramatic price fluctuations, reaching $60,000 in 2021 and dropping to $16,000 in 2022.

## Historical Evolution and Social Impact

-Milestone Events

2008 Whitepaper: Satoshi Nakamoto published "Bitcoin: A Peer-to-Peer Electronic Cash System", proposing decentralized currency vision.

2010 First Physical Transaction: Programmer purchased 2 pizzas with 10,000 BTC (now worth hundreds of millions), initiating cryptocurrency practicality.

2017 Fork and Scaling Controversy: Community disagreement led to Bitcoin fork into BTC (main chain) and BCH (Bitcoin Cash), exposing decentralized governance challenges.

2021 Institutionalization: Tesla, MicroStrategy etc. included in balance sheets, Bitcoin futures ETF approved, promoting mainstream financial acceptance.

-Application Scenario Expansion

Payment Network: Lightning Network (Layer 2) enables small fast transactions, solving main chain low throughput (about 7 TPS) issue.

Store of Value: Citizens in some countries (e.g., Argentina, Nigeria) use it as anti-inflation asset to hedge against fiat currency depreciation risk.

Technical Derivative Ecosystem: Catalyzed innovations like smart contracts, DeFi (Decentralized Finance), NFTs, but Bitcoin itself remains focused on "digital gold" positioning.

Through this knowledge base, you will learn Bitcoin's core functions, advanced features and ecosystem applications, helping you stay ahead in this rapidly developing field.

## Task Status Legend:
⬜ Not Started ⌛ In Progress ✅ Completed

## 1. Basic Functions

### 1.1 Payment Addresses
Bitcoin address types and encoding methods:
- **P2PKH** (Pay to Public Key Hash) ✅
- **P2SH-P2PKH** (Pay to Script Hash - Pay to Public Key Hash) ✅
- **P2WPKH** (Pay to Witness Public Key Hash) ✅
- **P2TR** (Pay to Taproot) ✅
- **Base58 Encoding** ✅
- **Bech32 Encoding** ✅
- **Bech32m Encoding** ✅

### 1.2 Wallets
Bitcoin wallet types and characteristics:
- **Standard Wallets** ⌛
- **Hierarchical Deterministic Wallets (HD Wallets)** ✅

### 1.3 Transactions
Bitcoin transaction knowledge:
- **UTXO Analysis** ⌛
- **Coinbase Transactions** ⬜
- **Transaction Construction** ⌛
- **Fee Estimation** ⌛
- **Signature Algorithms** ✅

### 1.4 Tools
Common tools in Bitcoin ecosystem:
- **Blockchain Explorers** ⌛
- **Network Hashrate** ⬜
- **API Services** ⬜
- **Data Analysis Tools** ⬜

## 2. Advanced Functions

### 2.1 PSBT (Partially Signed Bitcoin Transactions)
Introduction and usage of PSBT:
- **PSBT Protocol Introduction** ✅
- **Creating and Parsing PSBT** ✅
- **PSBT V2** ⬜

### 2.2 Taproot
Introduction and advantages of Taproot technology:
- **Schnorr Signatures** ✅
- **MAST** (Merkelized Abstract Syntax Tree) ✅
- **Privacy and Efficiency Improvements** ⬜
- **Differences between Key Path and Script Path** ⬜

### 2.3 Multisignature Addresses
Usage and advantages of multisignature addresses:
- **Multisignature Introduction** ✅
- **OP_CHECKMULTISIG** ✅
- **OP_CHECKMULTISIGVERIFY** ✅
- **OP_CHECKSIGADD** ✅

## 3. Ecosystem Applications
- **BRC20 Protocol Introduction** ✅
- **ARC20 Protocol Introduction** ✅
- **Runes Protocol Introduction** ✅
- **Lightning Network Introduction** ⌛
- **Lightning Network Core Logic** ⌛
- **OP_CAT** ✅
- **Babylon | BTC Staking** ⬜