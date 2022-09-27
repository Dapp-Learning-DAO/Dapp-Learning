# Overview

Quixotic is a NFT trading market on Optimisim. It is stolen in 2022, causing the whole contract paused forever.


# How quixotic works

Quixotic is composed of four contracts:

- ExchangeV4: Core logic of quixotic
- ExchangeRegistry: Maintains NFF contract royalties
- CancellationRegistry: Filled orders
- PaymentERC20Registry: Alloed payment erc20 tokens to settle

ExchangeV4 maintains three kind of fills:
- fillSellOrder
- fillBuyOrder
- fillDutchAuction

Take fillSellOrder as example. Seller creates, sign and publish her sell order into quixotic servers. When a buyer wanna a deal, her calls fillSellOrder with the signed sell order and her wallet address as input. The quixotic contract would verify and complete the trade, where the NFT is moved from seller to buyer whereas ERC20 tokens are transfered from buyer to seller as payment.

# Vulnerabilities

Put it simple, the fillSellOrder function does not verify the buyer:

```solidity
    function fillSellOrder(
        address seller,
        address contractAddress,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint256 startTime,
        uint256 expiration,
        uint256 createdAtBlock,
        bytes memory signature,
        address buyer
    ) external { 
    // verify sell order
    //[IT DOES NOT CHECK THE BUYER!!!!]
    // transfer nft to buyer
    // transfer payment to seller
    }
```

Malicious user could explot this vulnerability as he could create fake sell order to trade worthless NFT to buyer without authorizations from buyer.

Here are the steps:
- 0) Seller chooses a buyer who already approve quixotic to spend her tokens

- 1) Seller creates an NFT contract and mint one to herself

- 2) Seller approve quixotic to operate her fake NFT contract

- 3) Seller creates seller order, where this faked NFT will be sold to buyer with a high price

- 4) Seller calls fillSellOrder

Please refer to SampleQuixotic and test for more detail.

# How to run
In this demo, we create a simplifed version of Quixotic naming SampleQuixotic.

```
yarn
npx hardhat test
```

