**ERC721A 算法分析与设计**

## 参考链接：

1. [OpenZeppelin的EIP721实现](https://learnblockchain.cn/article/3041)
2. [Azuki的EIP721A实现](https://www.azuki.com/erc721a)

## OpenZeppelin实现的缺点

在一个典型的NFT中，通常会利用OZ的EIP721模板来做如下实现：

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

其中，_safeMint是OZ中提供的mint API函数，其具体调用如下：

```javascript
function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, _data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }
function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId);

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }
```

从上述的实现过程中可以看到，对于普通的NFT mint过程，其算法复杂度是O(N),即用户需要mint N个NFT，则需要循环调用N次单独的mint方法。

其最核心的部分在于：OZ的实现中，在mint方法内部，维护了两个全局的mapping。

分别是用于记录用户拥有的NFT数量的balance和记录tokenID到用户映射的owners。不管是mint还是transfer，其内部都需要去更新这两个全局变量。单就mint来讲，mint 1个NFT就需要进行至少2次SSTORE。而mint N个NFT则需要进行至少2N次SSTORE。

## ERC721A的改进

从OpenZeppelin的实现缺点来看，其主要缺点在于没有提供批量Mint的API，使得用户批量Mint时，其算法复杂度达到O(N).故ERC721A提出了一种批量Mint的API，使得其算法复杂度降为O(1).

### 最简单的想法：

最简单的想法莫过于直接修改_mint函数，将批量mint的数量也作为参数传入，然后在_mint函数里面修改balance和owners两个全局变量。由于是批量mint，与OZ的单独mint方式不同的是，其需要在mint函数内部维护一个全局递增的tokenID。另一个需要注意的事情是：根据EIP721规范，当任何NFT的ownership发生变化时，都需要发出一个Transfer事件。故这里也需要通过For循环的方式来批量发出Transfer事件。

```javascript
function _mint(address to, uint256 quantity) internal virtual {
...//checks
        uint256 tokenId = _currIndex;
        _balances[to] += quantity;
        _owners[tokenId] = to;
···//emit Event
        for (uint256 i = 0; i < quantity; i++) {
           emit Transfer(address(0),to,tokenId);
           tokenId++;
        }
   //update index
        _currIndex = tokenId;
}
```

对该简单想法的分析：

1. 是O(1)还是O(N)? 新的mint肯定是O(1)的算法复杂度。容易引起误解的是里面仍然包含了一个for循环，但是该for循环里面只做了emit事件的操作。从OPCODE的角度来看，在for循环里面，其实只有LOG4 和 ADD两个OPCODE，没有特别消耗Gas的SSTORE。（tokenId++只是一个局部变量的++，而非全局变量的++，对应的OPCODE也只是ADD而没有SSTORE）
2. 在上述的mint实现中，事实上只在用户mint的开头更新了一下对应的tokenId的归属，对于后续tokenId事实上没有去更新相应的tokenId归属，即仍然为address(0). 如下图所示：alice在mint5个之后，系统事实上只在tokenId=2的地方记录了其_owners[2]=alice, 其余的tokenId如3，4，5，6,为节约SSTORE的次数，其_owners仍然为address(0)![](assets/20220211_115434_image.png)当下一个用户Bob来批量mint时，其会从7直接开始mint。

![20220211151047.png](https://img.learnblockchain.cn/attachments/2022/02/Pjcvo7vN62060bfa586c9.png)

该最简单想法的问题：

1. 因为并不是每一个tokenId都记录了对应的owner，那么对于owners[tokenId]=address(0)的那部分tokenId其owner应该为谁？
   如果是OZ的实现，每一个tokenId都在owners[tokenId]存在对应的owner地址，如果其为address(0),说明该tokenId还没有被mint出来,即_exists[tokenId]=false。
   但是对于ERC721A算法，一个tokenId的owners为address(0)存在两种可能的情况：1. 该tokenId确实还没有mint出来，不存在；2. 该tokenId属于某一个owner，但不是该owner批量mint的第一个。
   即，应该如何实现ownerOf方法：
   观察mint得到的tokenId，可以发现其均为连续，单调递增的整数序列，即:0,1,2,3... 单纯只考虑mint的情况，不考虑transfer的情况，可以得到一个简单的算法，即：将该tokenId依次递减，遇到的首个不为address(0)的地址即为该tokenId的Owner。该算法如何排除还没有mint出来的那部分tokenId呢？可以通过比较tokenId与当前的currIndex，如果tokenId<currIndex，则说明该tokenId的owner必然不为address(0)，如果tokenId>=currIndex，则说明该tokenId还没有被mint出来。

![20220211151107.png](https://img.learnblockchain.cn/attachments/2022/02/2noHMnvS62060c0f4f7e4.png)

```javascript
function _exists(uint256 tokenId) internal view returns (bool) {
   tokenId < _currentIndex;
}

function ownershipOf(uint256 tokenId) internal view returns (TokenOwnership memory) {
//check exists
   require(_exists(tokenId),"OwnerQueryForNonexistentToken");
//遍历 递减
   for (uint256 curr = tokenId;curr >= 0;curr--) {
      address owner = _owners[curr];
      if (owner != address(0)) {
         return owner;
      }
   }
   revert("Ownership Error");
}
function ownerOf(uint256 _tokenId) external view returns (address) {
  return ownershipOf(_tokenId).addr;
}
```

2. 如果用户alice在mint后在transfer给bob，此时alice的tokenId区域就不连续了，此时应该如何来更新？即如何设计transfer方法
   
   对于alice，其拥有2，3，4，5，6这5个NFT，当其把3转给bob时，系统的更新应该如下：首先把tokenId=3的NFT的owner更新bob，然后在tokenId=4的NFT的owner应该由原来的address(0)更新为alice。这里的transfer不是批量操作，而是单个NFT的操作。对于多个NFT的批量transfer，这种算法仍然需要O(N).
   ![20220211151137.png](https://img.learnblockchain.cn/attachments/2022/02/fDg1Xr2R62060c2d43d19.png)

具体实现逻辑如下：

```javascript
function _transfer(address from,address to,uint256 tokenId) private {
   //check ownership
   TokenOwnership memory prevOwnership = ownershipOf(tokenId);
   require(from == prevOwnership.addr);
   //update from&to
   balance[from] -= 1;
   balance[to] += 1;
   _owners[tokenId] = to;
   uint256 nextTokenId = tokenId + 1;
   if (_owners[nextTokenId] == address(0) && _exists(nextTokenId)) {
      _owners[nextTokenId] = from;
   }
   emit Transfer(from,to,tokenId);
}
```

3. 第三个问题是如何实现tokenOfOwnerByIndex这一个枚举方法？
   在OZ中，其实现是基于一个全局的mapping：mapping(address=>mapping(uint256=>uint256)) private _ownedTokens;
   然而在ERC721A中，并没有给每一个TokenId都储存一个对应的owner，自然也无法通过这种方式来获取到某个owner的tokenid列表。
   鉴于ERC721A解决的问题比较特殊，即所有的tokenId都是连续的整数。一个最简单的思路可以是：遍历整个tokenId序列，找到属于该owner的所有tokenId，并按照时间戳的顺序来对所有的tokenId进行排序，对于同一个时间戳的，应该按照tokenId从小到大的顺序排序。
   根据EIP721标准，其顺序并不作相应的要求。故可以不使用上面的排序方式。只要保证有序就行。
   
   具体的遍历过程应该如下：从tokenId=0开始遍历，拿到当前tokenId的owner，记录为curr。如果下一个tokenId的owner是address(0)，则curr保持不变；如果下一个tokenId的owner不是address(0),则curr相应的更新。如果curr==alice，则判断tokensIdsIndex==index，如果不等，则tokensIdsIndex++.如果相等，则直接返回tokenId。

![20220211151200.png](https://img.learnblockchain.cn/attachments/2022/02/HeHrTLtO62060c4422b97.png)

```javascript
function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256) {
    //check index <= balance
    require(index <= balanceOf(owner),"OwnerIndexOutOfBounds");
    uint256 max = totalSupply();
    uint256 tokenIdsIndex;
    uint256 curr;
    for (uint256 i = 0; i < max; i++) {
       address alice = _ownes[i];
       if (owner != address(0)) {
          curr = alice;
       }
       if (curr == owner) {
          if (index == tokenIdsIndex) return i;
          tokenIdsIndex++;
       }
    }
    revert("error");

}
```

## ERC721A 算法的局限性

从上面的分析可以看出，ERC721A算法相较于OpenZeppelin的EIP721实现有比较大的突破，但是也有自身的局限性。还有部分我暂未理解清楚：

局限性：

ERC721A针对的NFT批量铸造过程，需要tokenId从0开始连续单调递增，如果tokenId是不连续的正整数，比如用timestamp来作为tokenId，该算法其实就会失效。

没看懂的部分：

1. 为什么需要一个timestamp？
   ```
   struct TokenOwnership {
           address addr;
           uint64 startTimestamp;
       }
   ```

这个startTimestamp有什么用？
