# Bitcoin (BTC)

This repository aims to provide comprehensive information on Bitcoin (BTC) technology, covering its basic functions, advanced applications, and various protocols and tools in its ecosystem. Whether you are a beginner or an experienced developer, this guide will help you gain a deeper understanding and make efficient use of Bitcoin technology.

## Introduction

Bitcoin is the first decentralized digital currency based on blockchain technology, proposed by an individual or group using the pseudonym "Satoshi Nakamoto" in 2008 and officially launched in 2009. It disrupts traditional financial systems by enabling trustless value transfers through cryptography and a distributed network. It functions as a payment tool, an investment asset, and a social experiment that redefines the boundaries of money and trust.

Bitcoin combines cryptography, economics, and distributed systems to pioneer decentralized digital assets. Its value stems from technical reliability (censorship resistance, scarcity), social consensus (the "digital gold" narrative), and macroeconomic conditions (fiat currency over-issuance, geopolitical conflicts). Despite challenges such as scalability bottlenecks, energy debates, and regulatory uncertainty, Bitcoin continues to drive financial innovation, becoming the core symbol of the blockchain revolution and redefining the future of money, trust, and value.


##Core Technical Mechanisms

-Blockchain and Decentralization
Transaction data is stored on a transparent, distributed ledger (blockchain) maintained by a global network of nodes, with no central authority. A chain structure (blocks linked via hash values) and timestamping ensure data immutability.

-Cryptography and Security
Uses the SHA-256 hashing algorithm and asymmetric encryption (public addresses and private key signatures) to secure transaction ownership and integrity. Proof of Work (PoW): Miners compete computationally to validate transactions and create new blocks, consuming energy to safeguard the network while earning newly minted coins as rewards.

-Deflationary Model
Total supply capped at 21 million coins, with issuance halved every four years ("halving"), ending in 2140. Its scarcity mirrors that of gold.


##Key Features and Innovations

-Trustless System
Operates without reliance on banks or governments, governed solely by code. Users fully control assets (ownership via private keys).

-Censorship Resistance and Global Accessibility
Borderless transactions on a resilient network, ideal for cross-border payments and inflation hedging (e.g., Bitcoin’s adoption as legal tender in El Salvador).

-Pseudonymity
Transactions use encrypted addresses, not tied to real-world identities, but on-chain records are publicly traceable. Privacy tools (e.g., coin mixers) enhance anonymity.

-Irreversibility
Confirmed transactions cannot be reversed, reducing fraud but requiring caution (e.g., accidental transfers are permanent).

-High Volatility
Prices fluctuate due to market demand, regulation, and speculation. Bitcoin peaked at 60,000 in 2021, then fell to16,000 in 2022.


##Historical Evolution and Societal Impact

-Milestones

2008 Whitepaper: Satoshi Nakamoto published Bitcoin: A Peer-to-Peer Electronic Cash System, outlining a decentralized currency vision.

2010 First Real-World Transaction: A programmer paid 10,000 BTC for two pizzas (worth billions today), marking Bitcoin’s practical adoption.

2017 Fork and Scaling Debate: Community disputes split Bitcoin into BTC (main chain) and BCH (Bitcoin Cash), exposing governance challenges in decentralized systems.

2021 Institutional Adoption: Companies like Tesla and MicroStrategy added Bitcoin to their balance sheets, and Bitcoin futures ETFs gained approval, boosting mainstream acceptance.

-Expanding Use Cases

Payment Network: The Lightning Network (Layer 2) enables fast microtransactions, addressing the main chain’s low throughput (~7 transactions/second).

Store of Value: Used in hyperinflationary economies (e.g., Argentina, Nigeria) to hedge against fiat currency collapse.

Ecosystem Innovation: Spurred advancements like smart contracts, DeFi (decentralized finance), and NFTs, though Bitcoin remains focused on its "digital gold" role.

This knowledge repository will guide you through Bitcoin's basic functionalities, advanced features, and ecosystem applications, helping you stay at the forefront of this rapidly evolving field.

## Task Status Legend

⬜ Not Started ⌛ In Progress ✅ Completed

## 1. Basic Features

### 1.1 Payment Addresses

Types of Bitcoin addresses and their encoding:

- **P2PKH** (Pay to Public Key Hash) ✅
- **P2SH-P2PKH** (Pay to Script Hash - Pay to Public Key Hash) ✅
- **P2WPKH** (Pay to Witness Public Key Hash) ✅
- **P2TR** (Pay to Taproot) ✅
- **Base58 Encoding** ✅
- **Bech32 Encoding** ✅
- **Bech32m Encoding** ✅

### 1.2 Wallets

Types of Bitcoin wallets and their characteristics:

- **Standard Wallets** ⌛
- **HD Wallets (Hierarchical Deterministic Wallets)** ✅

### 1.3 Transactions

Key knowledge about Bitcoin transactions:

- **UTXO Analysis** ⬜
- **Coinbase Transactions** ⬜
- **Transaction Construction** ⬜
- **Fee Estimation** ⬜
- **Signature Algorithms** ✅
- **Transaction Acceleration** ⬜

### 1.4 Tools

Common tools in the Bitcoin ecosystem:

- **Blockchain Explorers** ⌛
- **Network Hash Rate Tools** ⬜
- **API Services** ⬜
- **Data Analysis Tools** ⬜

## 2. Advanced Features

### 2.1 PSBT (Partially Signed Bitcoin Transaction)

Introduction and usage of PSBT:

- **PSBT Protocol Introduction** ✅
- **Creating and Parsing PSBT** ✅
- **PSBT V2** ⬜

### 2.2 Taproot

Introduction to Taproot and its benefits:

- **Schnorr Signatures** ✅
- **MAST** (Merkelized Abstract Syntax Tree) ✅
- **Privacy and Efficiency Improvements** ⬜
- **Key Path vs. Script Path Differences** ⬜

### 2.3 Multisig Addresses

Usage and advantages of multisig addresses:

- **Multisig Address Introduction** ✅
- **OP_CHECKMULTISIG** ✅
- **OP_CHECKMULTISIGVERIFY** ✅
- **OP_CHECKSIGADD** ✅

## 3. Ecosystem Applications

- **BRC20 Protocol Overview** ✅
- **ARC20 Protocol Overview** ✅
- **Runes Protocol Overview** ✅
- **Lightning Network Introduction** ⌛
- **Core Logic of the Lightning Network** ⌛
- **OP_CAT** ✅
- **Babylon | BTC Staking** ⬜
