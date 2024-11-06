# Polygon
Polygon is not just wants to provide a scaling solution, but wants to create an ecosystem that links all of the different scaling solutions, such as Plasma, Optimistic, rollups and ZK rollups. 

Right now, Polygon supports two types of Ethereum-compatible networks: stand-alone network && secured chain:  
- Stand-alone networks rely on their own security, for example, they have their own consensus model, such as Proof of Stake (PoS) or Delegated Proof of Stake (DPoS)   
- Secured chains use a "security-as-a-service" model. It can be provided directly by Ethereum, for example through fraud proofs used by Plasma, or by specialized verification nodes. These validation nodes run in the Polygon ecosystem and can be shared by multiple projects - a concept similar to Poca's shared security model  

The main point to focus on when it comes to Polygon's architecture is that it is deliberately designed to be generic and abstract. This allows other applications that wish to extend to choose the extended solution that best suits their needs.  

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/29-Polygon(matic)-layer2/matic.jpeg?raw=true" /></center>

<br/>
<br/>

## Polygon scaling solution  

<center>
    <img src="./img/scalling.jpg" alt="matic.jpeg" style="zoom:50%;" />
</center>

## Polygon Plasma Chain

---

[(Polygon Plasma Chain)](https://docs.polygon.technology/docs/develop/ethereum-polygon/plasma/getting-started/)  
Users can transfer assets from Ethereum network to polygon network through Plasma, on which the fee is very low.  
But here is a drawback with it. That users need to wait for a long time when withdraw asset back to Ethereum network. 

## Polygon State Transfer  

---

[(Polygon State Transfer)](https://docs.polygon.technology/docs/develop/l1-l2-communication/state-transfer)   
Polygon validators continuously monitor a contract on Ethereum chain called StateSender. Each time a registered contract on Ethereum chain calls this contract, it emits an event. Using this event Polygon validators relay the data to another contract on Polygon chain. This StateSync mechanism is used to send data from Ethereum to Polygon.

Polygon validators also periodically submit a hash of all transactions on Polygon chain to Ethereum chain. This Checkpoint can be used to verify any transaction that happened on Polygon. Once a transaction is verified to have happened on Polygon chain, action can be taked accordingly on Ethereum.

## Polygon SDK

---

[(Polygon SDK)](https://polygon.technology/polygon-sdk/) A modular and scalable framework for building Ethereum-compatible blockchain networks, written in Golang.

## Polygon Avail

---

[(Polygon Data Avail)](https://blog.polygon.technology/introducing-avail-by-polygon-a-robust-general-purpose-scalable-data-availability-layer-98bc9814c048) Avail is a general-purpose, scalable data availability-focused blockchain targeted for standalone chains, sidechains, and off-chain scaling solutions.

<br/>
<br/>

# References 

## 1 Resources 

---

### Polygon Introduction 

- [Polygon brief introudction](https://biquan365.com/12636.html)
- [Polygon tutorial](https://www.yuque.com/docs/share/8e737364-c380-418e-af21-0f07095fe900)
- [Polygon framework](https://docs.matic.network/docs/contribute/matic-architecture)
- [Polygon Meta-transactions](https://docs.matic.network/docs/develop/metatransactions/getting-started)
- [Matic Network WhitePaper](https://www.chainnews.com/articles/022315243415.htm)

### Official Website

- [Polygon website](https://polygon.technology/)
- [Polygon scan](https://polygonscan.com/)
- [Polygon official docs](https://docs.matic.network/)
- [Awesome Polygon (Projects deployed on polygon)](http://awesomepolygon.com/)

### Developer Portal  

- [Polygon development docs](https://docs.matic.network/docs/develop/getting-started)
- [Matic mainnet](https://rpc-mainnet.maticvigil.com)
- [Mumbai testnet](https://rpc-mumbai.maticvigil.com)
- [Polygon faucet](https://faucet.matic.network/)

## 2 Polygon Application 

---

- [Polygon Official Application Form](https://airtable.com/shrDaWf1UYNzkhTbg)
- [Polygon Grant](https://polygon.technology/developer-support-program/)

## 3 Polygon development resources  

---

### How to

- [Polygon oracle](https://docs.matic.network/docs/develop/oracles/getting-started)
- [Polygon With Chainlink](https://docs.matic.network/docs/develop/oracles/chainlink)
- [Polygon With TheGraph](https://docs.matic.network/docs/develop/graph)
- [Polygon With hardhat](https://docs.matic.network/docs/develop/hardhat/)
- [Polygon Infura RPC Setup](https://www.youtube.com/watch?v=jz6idHfMGvk)

### Tools  

- [Gas estimate](https://docs.matic.network/docs/develop/tools/matic-gas-station/#usage)
- [Polygon scan APIs](https://polygonscan.com/apis)
- [Matic.js SDK](https://github.com/maticnetwork/matic.js)
- [Alchemy Developer Tool Suite](https://www.alchemy.com/)
- [Decentology Dapp Template](https://dappstarter.decentology.com/)

### Tutorial 

- [Create NFT on polygon，upload images to IPFS](https://medium.com/pinata/how-to-create-layer-2-nfts-with-polygon-and-ipfs-aef998ff8ef2)
- [How to create NFT on polygon](https://cloud.tencent.com/developer/article/1828250)
