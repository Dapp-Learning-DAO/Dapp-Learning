# **ERC721A 算法分析与设计**

## **参考链接**

1. [OpenZeppelin 的 EIP721 实现](https://learnblockchain.cn/article/3041)  
2. [Azuki 的 EIP721A 实现](https://www.azuki.com/erc721a)



## **OpenZeppelin 实现的缺点**

在典型的 NFT 项目中，开发者通常利用 OpenZeppelin (OZ) 提供的 EIP721 模板进行实现。以下是一个常见的铸造逻辑示例：

```javascript
function mintNFT(uint256 numberOfNfts) public payable {
    //检查totalsupply不能超过
    require(totalSupply() < MAX_NFT_SUPPLY);
    require(numberOfNfts.add(totalSupply()) < MAX_NFT_SUPPLY);
    //检查numberOfNFT在(0,20]
    require(numberOfNfts > 0 && numberOfNfts <=20);
    //检查价格*numberOfNFT==msg.value
    require(numberOfNfts.mul(getNFTPrice()) == msg.value);
    //执行for循环，每个循环里都触发mint一次，写入一个全局变量
    for (uint i = 0; i < numberOfNfts; i++) {
        uint index = totalSupply();
        _safeMint(msg.sender, index);
    }
}
```

### **缺点分析**
1. **单次 mint 的低效率**  
   OZ 的实现中，每次调用 `_safeMint` 都会触发多次存储操作 (`SSTORE`)。在一个典型的 `mint` 操作中，以下两个全局变量会被频繁更新：  
   - `_balances`: 记录地址拥有的 NFT 数量。  
   - `_owners`: 记录每个 `tokenId` 对应的拥有者地址。  

2. **性能瓶颈**  
   当批量铸造 N 个 NFT 时，算法复杂度为 \(O(N)\)，因为需要循环调用 N 次 `mint` 方法。单次 `mint` 至少涉及两次 `SSTORE` 操作，批量铸造 N 个 NFT 则需执行至少 \(2N\) 次 `SSTORE` 操作，导致 Gas 成本显著增加。



## **ERC721A 的改进**

ERC721A 的核心目标是优化批量铸造的效率，通过提供一个批量铸造的 API，使算法复杂度从 \(O(N)\) 降为 \(O(1)\)。以下是其基本实现思路：

### **批量 Mint 的简单实现**

ERC721A 的批量铸造通过改写 `_mint` 函数实现，允许开发者一次性指定铸造的 NFT 数量并批量更新全局变量。

```javascript
function _mint(address to, uint256 quantity) internal virtual {
    uint256 tokenId = _currIndex;
    _balances[to] += quantity;
    _owners[tokenId] = to;

    for (uint256 i = 0; i < quantity; i++) {
        emit Transfer(address(0), to, tokenId);
        tokenId++;
    }

    _currIndex = tokenId;
}
```



### **改进分析**

#### 1. **性能优化：从 \(O(N)\) 到 \(O(1)\)**
- **算法复杂度**：  
  批量铸造中虽然包含 `for` 循环，但该循环仅用于发出 `Transfer` 事件，不涉及昂贵的存储操作（如 `SSTORE`）。Gas 成本大幅降低。
- **存储优化**：  
  批量铸造时，仅记录第一个 `tokenId` 的 `owner`，后续 `tokenId` 的 `owner` 被默认为同一地址，直到下一次铸造或转移操作。

#### 2. **存储稀疏性**
- 在批量铸造过程中，仅存储第一个 `tokenId` 的 `owner` 信息，节省了对后续 `tokenId` 的存储开销。例如，当用户 `Alice` 批量铸造 5 个 NFT 时，仅记录 `_owners[2] = Alice`，其余 `tokenId` 的 `owner` 默认为 `address(0)`，直到发生转移。

#### 3. **实现 `ownerOf` 的改进逻辑**
  因为 `_owners` 数组稀疏存储，只记录部分 `tokenId` 的 `owner`，需要通过递减查询逻辑定位实际拥有者。

```javascript
function ownershipOf(uint256 tokenId) internal view returns (TokenOwnership memory) {
    require(_exists(tokenId), "OwnerQueryForNonexistentToken");

    for (uint256 curr = tokenId; curr >= 0; curr--) {
        address owner = _owners[curr];
        if (owner != address(0)) {
            return TokenOwnership(owner, _startTimestamps[curr]);
        }
    }

    revert("Ownership Error");
}
```



## **关键问题与解决方案**

### **1. 非连续 TokenID 的适用性**
- **问题**：  
  ERC721A 假定 `tokenId` 为连续单调递增的整数序列。如果 `tokenId` 是不连续的（如时间戳生成），算法会失效。
- **解决方案**：  
  对于非连续 `tokenId` 场景，可以补充每个 `tokenId` 的独立存储逻辑，但这将牺牲批量铸造的 Gas 优势。



### **2. 转移操作的处理**
- **问题**：  
  当 `transfer` 操作打破 `tokenId` 的连续性时，需要更新相关的 `_owners` 信息。例如，当 `Alice` 转移 `tokenId = 3` 给 `Bob` 时，需要明确更新 `tokenId = 4` 的 `_owner` 信息。
- **解决方案**：  
  在 `transfer` 方法中，通过判断后续 `tokenId` 的 `_owner` 是否为 `address(0)`，动态补充存储信息。

```javascript
function _transfer(address from, address to, uint256 tokenId) private {
    TokenOwnership memory prevOwnership = ownershipOf(tokenId);
    require(from == prevOwnership.addr);

    _balances[from] -= 1;
    _balances[to] += 1;
    _owners[tokenId] = to;

    uint256 nextTokenId = tokenId + 1;
    if (_owners[nextTokenId] == address(0) && _exists(nextTokenId)) {
        _owners[nextTokenId] = from;
    }

    emit Transfer(from, to, tokenId);
}
```



### **3. 枚举方法的实现**
- **问题**：  
  ERC721 标准要求实现 `tokenOfOwnerByIndex` 方法，而 ERC721A 的稀疏存储设计无法直接提供一个高效的索引查找方式。
- **解决方案**：  
  遍历整个 `tokenId` 序列，并根据 `owner` 归属动态生成结果。虽然效率较低，但在批量铸造场景中依然满足标准要求。

```javascript
function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256) {
    require(index < balanceOf(owner), "OwnerIndexOutOfBounds");

    uint256 max = totalSupply();
    uint256 tokenIdsIndex;
    address currOwner;

    for (uint256 i = 0; i < max; i++) {
        if (_owners[i] != address(0)) {
            currOwner = _owners[i];
        }

        if (currOwner == owner) {
            if (tokenIdsIndex == index) return i;
            tokenIdsIndex++;
        }
    }

    revert("Error");
}
```



## **ERC721A 的局限性**

1. **TokenID 必须连续**  
   批量铸造依赖于连续递增的 `tokenId`。非连续场景（如基于时间戳生成的 `tokenId`）需要额外适配。

2. **高频转移性能受限**  
   稀疏存储的设计在频繁转移操作中增加了存储更新的复杂性。



## **`startTimestamp` 的用途**

`startTimestamp` 是 `TokenOwnership` 结构的一部分，用于记录 `tokenId` 的持有起始时间。主要用途包括：
1. **持有时长计算**：奖励长期持有者或限制交易解锁时间。  
2. **市场排序支持**：支持基于持有时间的 NFT 排序功能。  
3. **历史溯源**：提供持有时间信息，便于审计和查询。



### **总结**

ERC721A 在批量铸造场景下极大优化了 Gas 成本，但需要针对高频转移和非连续 `tokenId` 的场景进一步适配。其设计适合一次性生成大量 NFT 的场景，如 PFP 项目或游戏资产发行。