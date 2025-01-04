# Merkle Distributor Airdrop

## Introduction

### NFT merkle airdrop

This demo introduces 5 methods for NFT-airdrop:
- Airdrop to specific address
- A signature implying the beneficiary is submitted to blockchain for verification and airdropping
- A signature following EIP-712 is submitted to blockchain for verification and airdropping
- A signature following EIP-712 is submitted to blockchain for verification ,signature check and airdropping
- A merkle proof is submitted to blockchain for verification and airdropping

### ERC20 merkle airdrop

Kindly refer to 1inch, dydx, uniswap for more details, all the projects utilize merkle proof for airdropping. Please read more for details:

- <https://itzone.com.vn/en/article/merkle-airdrop-the-airdrop-solution-for-token-issues/>

### Demo: Red packet

We present a demo in which you can airdrop to your friends on holiday!

Please refer to the code: contracts/redpacket

## Demo instruction

- ERC721Basic
  The most simple demo where the issuer can airdrop NFT to specific address by calling "mint" :

  ```js
  //
  await expect(this.registry.connect(this.accounts[1]).mint(account, tokenId))
    .to.emit(this.registry, 'Transfer')
    .withArgs(ethers.constants.AddressZero, account, tokenId);
  ```

- ERC721LazyMint  
  This is a demo where airdropping happens after verification. Considier the following case: Before the real "mint" is called on blockchain, the issuer firstly send an email containing the token id to the user, who will respond with a signature created with this token id. Then, the issuer wraps user address(fetched from some database), token id and signature as input to calls "redeem" of the NFT contract, which will mint a new NFT to the target user on verification success. 


  ```js
  // Signature
  this.token.signature = await this.accounts[1].signMessage(hashToken(this.token.tokenId, this.token.account));

  // Post the signature to blockchain
  await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.signature))
    .to.emit(this.registry, 'Transfer')
    .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
  ```

- ERC721LazyMintWith712  
  In the above example, we create signature with a parameter maybe friendly to machine but not that friendly to humans. Moreover, when Metamask pops up for signing we do not know what is being signed. We prefer a more structured, more readable scheme for us to see what data will be signed. EIP-712 address this point; It can display the data to be signed to user, and the generated signature will be verified by smart contract. The whole process is similiar to that in ERC721LazyMint. 

  Here is an example for creating signature by EIP-712:

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
  This demo is similiar to ERC721LazyMintWith712 but with a SignatureChecker inside.

  ```js
  function _verify(address signer, bytes32 digest, bytes memory signature)
      internal view returns (bool)
      {
          return hasRole(MINTER_ROLE, signer) && SignatureChecker.isValidSignatureNow(signer, digest, signature);
      }
  ```

- ERC721MerkleDrop  
  A merkle proof is generated and sent to blockchain for verification, if valid,  the newly created NTT is minted to specific user.

  ```js
  // Generate merkle proof offchain
  this.token.proof = this.merkleTree.getHexProof(hashToken(this.token.tokenId, this.token.account));

  // Verify the proof and mint to some user. Whole process happens onchain.
  await expect(this.registry.redeem(this.token.account, this.token.tokenId, this.token.signature))
    .to.emit(this.registry, 'Transfer')
    .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
  ```

## Quickstart

### Merkle airdrop

- Install dependencies

  ```bash
  yarn
  ```

- Test

  ```bash
  npx hardhat test
  ```

### HappyRedPacket

- Setup enviroments

  ```shell
  cp .env.exmpale .env

  ## Please configure PRIVATE_KEY, PRIVATE_KEY1, PRIVATE_KEY2,INFURA_ID, PROJECT_ID, TARGET_ACCOUNT in .env
  ## PRIVATE_KEY is the private key of your wallet account ， while TARGET_ACCOUNT is your wallet address.
  ## If you want multiple accounts trying to claim the same redpacket, please configures multiple PRIVATE_KEYs.
  ```

- Install dependencies

  ```shell
  yarn
  ```

- Deploy ERC20 smart contract
   Execute the following command and we take "Token address" from output as address of the deployed contract.

  ```shell
  npx hardhat run scripts/redpacket/1-deploySimpleToken.js --network kovan

  ## Console output
  Deploying contracts with the account: 0x3238f24e7C752398872B768Ace7dd63c54CfEFEc
  Account balance: 796474026501725149
  Token address: 0xdc6999dC3f818B4f74550569CCC7C82091cA419F
  1000000000
  ```

- Deploy RedPacket smart contract
  Execute the following command and we take "RedPacket address" from output as address of the deployed contract.

  ```shell
  npx hardhat run scripts/redpacket/2-deployHappyRedPacket.js --network kovan

  ## Console output
  Deploying contracts with the account: 0x3238f24e7C752398872B768Ace7dd63c54CfEFEc
  Account balance: 783625061469463255
  RedPacket address: 0x6F35e57a7421F5b04DDb47b67453A5a5Be32e58B
  ```

- Create a red packet  
  ```shell
  npx hardhat run scripts/redpacket/3-createRedPacket.js --network kovan

  ## Console output
  Approve Successfully
  merkleTree Root: 0x5cc6f1ff34a2c6f871d40cdc4559468f96a7ec06d7bf6ab0f9b5aeccc9b33154
  CreationSuccess Event, total: 10000   RedpacketId: 0x45eb11e56a1b699f5e99bd16785c84b73a8257c712e0d1f31306ab1e3423b2e0
  Create Red Packet successfully
  ```

- Claim packet
  ```shell
  npx hardhat run scripts/redpacket/4-claimRedpacket.js --network kovan

  ## We can see "Sign Message:" followed by a signature verified by smart contract 
  ```

## References

- <https://github.com/Anish-Agnihotri/merkle-airdrop-starter>
- <https://github.com/OpenZeppelin/workshops/tree/master/06-nft-merkle-drop/contracts>
- <https://github.com/miguelmota/merkletreejs>
- erc20 merkle drop: <https://github.com/trustlines-protocol/merkle-drop/blob/master/contracts/contracts/MerkleDrop.sol>
- merkle drop discussion: <https://forum.openzeppelin.com/t/creating-a-claimable-air-drop-too-many-addresses/6806>
- Evolution of Airdrop: <https://medium.com/hackernoon/evolution-of-airdrop-from-common-spam-to-the-merkle-tree-30caa2344170>
- github demo: <https://github.com/smartzplatform/constructor-eth-merkle-airdrop>
- uni airdrop: <https://github.com/Uniswap/merkle-distributor>
- uni airdrop: <https://steveng.medium.com/performing-merkle-airdrop-like-uniswap-85e43543a592>
- ethereum etl: <https://github.com/blockchain-etl/ethereum-etl>
