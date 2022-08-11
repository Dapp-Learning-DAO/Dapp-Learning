

# Background

In 2022 April, NBA release its NFT and during its phase of whitelist minting, some unauthorized user stole 100 nfts.

Here is the code:
```
    function mint_approved(
        vData memory info,
        uint256 number_of_items_requested,
        uint16 _batchNumber
    ) external {
        require(batchNumber == _batchNumber, "!batch");
        address from = msg.sender;
        require(verify(info), "Unauthorised access secret");
        _discountedClaimedPerWallet[msg.sender] += 1;
        require(
            _discountedClaimedPerWallet[msg.sender] <= 1,
            "Number exceeds max discounted per address"
        );
        presold[from] = 1;
        _mintCards(number_of_items_requested, from);
        emit batchWhitelistMint(_batchNumber, msg.sender);
    }
```

To put it simply, after authorized user Alice minted her token, another malicious user replay Alice's request which doesn't embedded any nonce inside, causing  _discountedClaimedPerWallet fail to prevent bob from minting tokens.

Here is the [txn](https://etherscan.io/tx/0x2e2d9f262dcaa4a6ccdb047092f837b0f65ae533b34332428674d3f36308ff83): 

I present a simplified version of this attack. Please refer to tests for more details.


# How to use

```
npm install
```


```
npx hardhat test
```