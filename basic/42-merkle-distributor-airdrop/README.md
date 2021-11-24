## 介绍  

### NFT merkel airdrop
本样例介绍了 5 种 NFT 空投方式  
- 直接对特定账户进行空投    
- 线下签名,线上验证通过后空投    
- 线下 EIP-712 方式签名, 线上验证后空投    
- 线下 EIP-712 方式签名, 线上进行 EIP-712 验证, Signature Check
- 线下生成 Merkle 证明, 线上 Merkle 验证   

### ERC20 merkel airdrop

参考1inch，dydx，uniswap都实现merkle空投。 具体原理请参考：
https://itzone.com.vn/en/article/merkle-airdrop-the-airdrop-solution-for-token-issues/  



## 合约功能说明  
- ERC721Basic 
最简单的 NFT 空投合约, 项目方直接调用 mint 接口, 对指定账户投放 NFT  
```js
// 
await expect(this.registry.connect(this.accounts[1]).mint(account, tokenId))
          .to.emit(this.registry, 'Transfer')
          .withArgs(ethers.constants.AddressZero, account, tokenId);
```

- ERC721LazyMint  
经过验证的空投方式. 可能在下面这种场景中出现, 比如项目方准备空投 NFT 给一些用户, 那么项目方先发送一个邮件给该用户, 邮件中包含此 NFT 的 tokenID. 用户收到邮件后, 在线下根据 toukenID 和 账户地址进行签名, 然后发送给项目方. 项目方拿到用户签名后, 调用空投合约的 redeem 接口, 传入 account, tokenId, signature. 其中 account, tokenId 需要从预先保留的项目方数据库中获取, 以验证该用户确实对应该 NFT. 如果验证通过, 则生成一个 NFT 给该用户. 
```js
// 签名 
this.token.signature = await this.accounts[1].signMessage(hashToken(this.token.tokenId, this.token.account));

// 签名上链验证 
await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.signature))
        .to.emit(this.registry, 'Transfer')
        .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
```


- ERC721LazyMintWith712  
在传统的签名方式中, 我们直接调用签名接口, 传入需要的签名参数, 这个过程中我们无法直观的感知需要签名具体参数意义, 特别是当 MetaMask 弹出提示, 需要你对一笔数据进行签名时, 如果不能结构化的看到需要签名的具体数据, 我们可能会拒绝签名这笔交易. 
EIP-712 就是在用户签名时把结构化数据展示给他们确认的场景. 之后链上确认签名是否正确, 过程和 ERC721LazyMint 类似 
链下签名样例如下: 
```js
// Domain
        {
          name: 'Name',
          version: '1.0.0',
          chainId: this.chainId,
          verifyingContract: this.registry.address,
        },
        // Types
        {
          NFT: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'account', type: 'address' },
          ],
        },
        // Value
        this.token,
      );
```

- ERC721LazyMintWith712SignatureChecker  
和 ERC721LazyMintWith712 类似, 唯一的区别就是在链上进行验证时, 增加了 SignatureChecker

```js
function _verify(address signer, bytes32 digest, bytes memory signature)
    internal view returns (bool)
    {
        return hasRole(MINTER_ROLE, signer) && SignatureChecker.isValidSignatureNow(signer, digest, signature);
    }
```

- ERC721MerkleDrop  
链下生成 Merkle 证明, 之后把 Merkle 证明发送到链上进行验证, 验证通过后, 就会给用户生成相应的 NFT token  
```js
// 链下生成 Merkle 证明 
this.token.proof = this.merkleTree.getHexProof(hashToken(this.token.tokenId, this.token.account));

// 调用链上接口进行验证, 同时生成 NFT token
await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.signature))
        .to.emit(this.registry, 'Transfer')
        .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
```

## 测试流程  
- 安装依赖  
```
yarn
```

- 执行测试程序  
```
npx hardhat test
```

## 参考链接  
- https://github.com/OpenZeppelin/workshops/tree/master/06-nft-merkle-drop/contracts    
- https://github.com/miguelmota/merkletreejs
- erc20 merkel drop: https://github.com/trustlines-protocol/merkle-drop/blob/master/contracts/contracts/MerkleDrop.sol   
- merkel drop discussion: https://forum.openzeppelin.com/t/creating-a-claimable-air-drop-too-many-addresses/6806
- Evolution of Airdrop： https://medium.com/hackernoon/evolution-of-airdrop-from-common-spam-to-the-merkle-tree-30caa2344170
- github demo： https://github.com/smartzplatform/constructor-eth-merkle-airdrop
- uni aridrop :https://github.com/Uniswap/merkle-distributor

