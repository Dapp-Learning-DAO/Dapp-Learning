# Merkle Distributor Airdrop

## 介绍

### NFT merkel airdrop

本样例介绍了 5 种 NFT 空投方式

- 直接对特定账户进行空投
- 线下签名,线上验证通过后空投
- 线下 EIP-712 方式签名, 线上验证后空投
- 线下 EIP-712 方式签名, 线上进行 EIP-712 验证, Signature Check
- 线下生成 Merkle 证明, 线上 Merkle 验证

### ERC20 merkel airdrop

参考 1inch，dydx，uniswap 都实现 merkle 空投。 具体原理请参考：

- <https://itzone.com.vn/en/article/merkle-airdrop-the-airdrop-solution-for-token-issues/>

### 抢红包

本样例演示了抢红包合约的功能, 在节假日的时候可以部署相应的合约进行红包发放.
对应合约路径为 contracts/redpacket

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

### Merkle airdrop

- 安装依赖

  ```bash
  yarn
  ```

- 执行测试程序

  ```bash
  npx hardhat test
  ```

### HappyRedPacket

- 配置环境环境变量

  ```shell
  cp .env.exmpale .env

  ## 在 .env 文件中配置 PRIVATE_KEY, PRIVATE_KEY1, PRIVATE_KEY2,INFURA_ID, PROJECT_ID, TARGET_ACCOUNT
  ## 比如有一个账户 A , 那么 PRIVATE_KEY 为账户 A 对应的 PRIVATE_KEY， TARGET_ACCOUNT 为账户 A 对应的账户地址
  ## 模拟多人抢红包，需要配置三个私钥
  ```

- 安装依赖

  ```shell
  yarn
  ```

- 部署 ERC20 合约  
  执行如下命令，然后获取输出的 "Token address" 值

  ```shell
  npx hardhat run scripts/redpacket/1-deploySimpleToken.js --network kovan

  ## 输入信息如下:
  Deploying contracts with the account: 0x3238f24e7C752398872B768Ace7dd63c54CfEFEc
  Account balance: 796474026501725149
  Token address: 0xdc6999dC3f818B4f74550569CCC7C82091cA419F
  1000000000
  ```

- 部署 RedPacket 合约  
  执行如下命令，然后获取输出的 "RedPacket address" 值

  ```shell
  npx hardhat run scripts/redpacket/2-deployHappyRedPacket.js --network kovan

  ## 输出信息如下:
  Deploying contracts with the account: 0x3238f24e7C752398872B768Ace7dd63c54CfEFEc
  Account balance: 783625061469463255
  RedPacket address: 0x6F35e57a7421F5b04DDb47b67453A5a5Be32e58B
  ```

- 创建红包  
  ```shell
  npx hardhat run scripts/redpacket/3-createRedPacket.js --network kovan

  ## 输出值
  Approve Successfully
  merkleTree Root: 0x5cc6f1ff34a2c6f871d40cdc4559468f96a7ec06d7bf6ab0f9b5aeccc9b33154
  CreationSuccess Event, total: 10000   RedpacketId: 0x45eb11e56a1b699f5e99bd16785c84b73a8257c712e0d1f31306ab1e3423b2e0
  Create Red Packet successfully
  ```

- 领取红包
  ```shell
  npx hardhat run scripts/redpacket/4-claimRedpacket.js --network kovan

  ## 得到的输出 "Sign Message:" 即为领取红包时需要输入的签名信息，防止恶意领取
  ```

## 参考链接

- <https://github.com/Anish-Agnihotri/merkle-airdrop-starter>
- <https://github.com/OpenZeppelin/workshops/tree/master/06-nft-merkle-drop/contracts>
- <https://github.com/miguelmota/merkletreejs>
- erc20 merkel drop: <https://github.com/trustlines-protocol/merkle-drop/blob/master/contracts/contracts/MerkleDrop.sol>
- merkel drop discussion: <https://forum.openzeppelin.com/t/creating-a-claimable-air-drop-too-many-addresses/6806>
- Evolution of Airdrop: <https://medium.com/hackernoon/evolution-of-airdrop-from-common-spam-to-the-merkle-tree-30caa2344170>
- github demo: <https://github.com/smartzplatform/constructor-eth-merkle-airdrop>
- uni airdrop: <https://github.com/Uniswap/merkle-distributor>
- uni airdrop: <https://steveng.medium.com/performing-merkle-airdrop-like-uniswap-85e43543a592>
- ethereum etl: <https://github.com/blockchain-etl/ethereum-etl>