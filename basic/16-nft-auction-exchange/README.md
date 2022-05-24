English / [中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/16-nft-auction-exchange/README-CN.md)
## auction-exchange

Auction NFT assets

- Support Fixed price and then sell
- Support the auction

## Operation Process

### Configure The Private Key
Put the private key in the **.env** file and its format is as follows

```
INFURA_ID=yyyyyyyy
PRIVATE_KEY_MAIN=xxxxx
PRIVATE_KEY_ALICE=yyyyy
PRIVATE_KEY_BOB=ttttt
PRIVATE_KEY_TEST=zzzzz
```

### Start the local test network

- New start command line input `hardhat node`

  **npx hardhat node --network hardhat**

- Start **ipfs**  
  ipfs daemon

- New start command line deployment contract input  
  npx hardhat run scripts/upload.js --network localhost
  npx hardhat run scripts/react_app_contract.js --network localhost

### The Front-End start

- Configuration Parameters  
  When **react** is started, some checks are performed. These checks cause **react** startup to fail, so you need to configure it to skip unnecessary checks.
Env is already configured in **.sample.env** configuration, so you just need to copy the configuration file.

  ```
  cd react-app
  cp .env.example .env
  ```

- The Front-End start

  ```
  yarn install
  yarn start
  ```

- Use **MetaMask** to link local nodes

  - Switch **MetaMask** account to localhost
  - network id: 31337
  - rpc: http://localhost:8545

- Open **react** page  
  Open **react** page, default **http://localhost:3000**

- Initial capital is injected through **Faucet**
  Tap the "Faucet" button in the upper right corner of the page to inject initial funds for subsequent auctions

- Mint Assets 
  On **react** page, click the "Mint" button at the bottom of the image to produce ERC721 assets. You can then view your assets in "YourCollectibles"

- Start Auction  
  After Mint, the "Start Auction" button will appear under the picture, click the button to Start the Auction, there are two kinds of Auction, "Auction Fixed Price" and "Auction Unfixed Price". Select "Auction Fixed Price" to Auction (after Auction, you will find that your "yourcollectibles" assets disappear).

- Switch Account 
  Switch **MetaMask** to another account and the page refreshes. Refresh may be a bit slow here, so wait until the account in the upper right corner shows up as a new account.

- Bid to Buy  
  Auction's images are Bid with the new account, and after successful purchases, the purchased assets can be viewed in "yourcollectibles.

## Contract testing steps:

- Executing unit tests  
  AuctionFixedPrice.sol : Auction Fixed Price  
  AuctionUnfixedPrice.sol: Auction Unfixed Price

  ```
  npx hardhat test
  ```

- Execute **script** under script

  ```
  npx hardhat run scripts/auction-fix-price-script.js --network kovan
  ```

## Refer to the link

- https://medium.com/coinmonks/how-to-implement-an-erc721-market-f805959ddcf
- https://docs.matic.network/docs/develop/advanced/swap-assets
- https://github.com/ethers-io/ethers.js/issues/368
- Timestamp related problems of virtual machine nodes：https://ethereum.stackexchange.com/questions/86633/time-dependent-tests-with-hardhat
- Wyvern Protocol used by Opensea: https://github.com/wyvernprotocol/wyvern-v3
- https://explorer-mainnet.maticvigil.com/address/0x8d1566569d5b695d44a9a234540f68D393cDC40D/contracts
- https://github.com/ssteiger/Ethereum-NFT-Store-with-Dutch-Auctions
- Dutch auction：
  https://medium.com/@shopevery/building-smart-contracts-for-a-dutch-auction-part-1-81dc5c770f1f
  https://corporatefinanceinstitute.com/resources/knowledge/finance/dutch-auction/

## Todo List

### Administration Page

- NFT Generates pages
- My NFT list page
- Initiate auction operation dialog box
- Initiate auction list page
- Bid record list page

### The Front-End Page

- Home page
- About
- NFT list page
- Auction list page
- Bid dialog box

### Abnormal Page

- When confirming the account, **Metamask** calls up the page
- No **MetaMask**, **MetaMask** download page

### Not been determined

- The Collection function
- Personal Data function
