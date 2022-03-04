# Bundlr Network Browser Client Demo

This app demonstrates usage of the [`bundlr-client`](https://github.com/Bundlr-Network/js-client) to upload data
to the [Bundlr Network](https://bundlr.network) using any `web3provider` exposed by the [Ethers library](https://github.com/ethers-io/ethers.js), including Metamask or WalletConnect.

## Usage

1. Connect Metamask or WalletConnect (ensure your wallet is connected to Polygon)
2. Provide address of the bundlr network node to connect to and sign the requested message to initiate bundlr network connection
3. Click "Get Matic Balance" to view your current balance with the selected bundlr network node
4. Enter an amount (in MATIC) to fund the bundlr with
5. Select any file from your device to upload to the network
6. Click "Upload to Bundlr Network" and sign the requested message to initiate an upload.  

## Notes

This app uses [`web3-react`](https://github.com/NoahZinsmeister/web3-react) to connect with Metamask and WalletConnect.  A full explanation of integrating any specific web3 wallet provider can be found there.