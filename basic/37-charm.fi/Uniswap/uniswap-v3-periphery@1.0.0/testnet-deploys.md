# Testnet Deploys

The latest version of `@uniswap/v3-core`, `@uniswap/v3-periphery`, and supporting contracts (e.g. `WETH9`, `Multicall2`)
are all deployed to testnets.

Note these addresses are not final, they will be changed as we make final updates to the periphery repository. These
addresses are given as of the following releases (tagged commits + npm packages):

- `@uniswap/v3-core`: `1.0.0-rc.2`
- `@uniswap/v3-periphery`: `1.0.0-beta.23`

Below you will find the addresses of each contract on each testnet. The keys in the JSON are mapped to their respective source code
in the table below:

| Key                                         | Source Code                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `v3CoreFactoryAddress`                      | https://github.com/Uniswap/uniswap-v3-core/blob/v1.0.0-rc.2/contracts/UniswapV3Factory.sol                                    |
| `weth9Address`                              | https://rinkeby.etherscan.io/address/0xc778417E063141139Fce010982780140Aa0cD5Ab#code                                          |
| `multicall2Address`                         | https://rinkeby.etherscan.io/address/0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696#code                                          |
| `proxyAdminAddress`                         | https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.1-solc-0.7-2/contracts/proxy/ProxyAdmin.sol                  |
| `tickLensAddress`                           | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/lens/TickLens.sol                               |
| `quoterAddress`                             | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/lens/Quoter.sol                                 |
| `swapRouter`                                | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/SwapRouter.sol                                  |
| `nftDescriptorLibraryAddress`               | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/libraries/NFTDescriptor.sol                     |
| `nonfungibleTokenPositionDescriptorAddress` | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/NonfungibleTokenPositionDescriptor.sol          |
| `descriptorProxyAddress`                    | https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.4.1-solc-0.7-2/contracts/proxy/TransparentUpgradeableProxy.sol |
| `nonfungibleTokenPositionManagerAddress`    | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/NonfungiblePositionManager.sol                  |
| `v3MigratorAddress`                         | https://github.com/Uniswap/uniswap-v3-periphery/blob/v1.0.0-beta.23/contracts/V3Migrator.sol                                  |

## Ropsten

```json
{
  "v3CoreFactoryAddress": "0x273Edaa13C845F605b5886Dd66C89AB497A6B17b",
  "weth9Address": "0xc778417E063141139Fce010982780140Aa0cD5Ab",
  "multicall2Address": "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  "proxyAdminAddress": "0x0Fb45B7E5e306fdE29602dE0a0FA2bE088d04899",
  "tickLensAddress": "0xd6852c52B9c97cBfb7e79B6ab4407AA20Ba31439",
  "quoterAddress": "0x2F9e608FD881861B8916257B76613Cb22EE0652c",
  "swapRouter": "0x03782388516e94FcD4c18666303601A12Aa729Ea",
  "nftDescriptorLibraryAddress": "0x8b96635D10A4034eC6E146A7c1129FCfa08A47D3",
  "nonfungibleTokenPositionDescriptorAddress": "0xEAC3e2e3098b6F2766CFB302d4106Bd8D6E38540",
  "descriptorProxyAddress": "0xbf1A262dA77FE8eB37A42650E196DEFFe00Cc1C9",
  "nonfungibleTokenPositionManagerAddress": "0x74e838ECf981Aaef2523aa5B666175DA319D8D31",
  "v3MigratorAddress": "0x764a2557D2af049bd026D382eEE05fBC7C5425E4"
}
```

## Kovan

```json
{
  "v3CoreFactoryAddress": "0x74e838ECf981Aaef2523aa5B666175DA319D8D31",
  "weth9Address": "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
  "multicall2Address": "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  "proxyAdminAddress": "0x764a2557D2af049bd026D382eEE05fBC7C5425E4",
  "tickLensAddress": "0xe2CE8F6cF0bc1c32605beaD58577ab1f08e086e6",
  "quoterAddress": "0xE7F35392a478CaAF3a8dA8E777078Fa3aBe0BaEF",
  "swapRouter": "0x8a0B62Fbcb1B862BbF1ad31c26a72b7b746EdFC1",
  "nftDescriptorLibraryAddress": "0xF76324f8A1B0625c44f80d12F44C8Cb539f8C84e",
  "nonfungibleTokenPositionDescriptorAddress": "0xf7D9132F8D2D2f14d35C1fA36beD9821865feC62",
  "descriptorProxyAddress": "0x288be1A33bcdfA9A09cCa95CA1eD628A5294e82c",
  "nonfungibleTokenPositionManagerAddress": "0x815BCC87613315327E04e4A3b7c96a79Ae80760c",
  "v3MigratorAddress": "0x6744951a0DD149A31Df7B6d42eA69607eD692029"
}
```

## Rinkeby

```json
{
  "v3CoreFactoryAddress": "0x815BCC87613315327E04e4A3b7c96a79Ae80760c",
  "weth9Address": "0xc778417E063141139Fce010982780140Aa0cD5Ab",
  "multicall2Address": "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  "proxyAdminAddress": "0x6744951a0DD149A31Df7B6d42eA69607eD692029",
  "tickLensAddress": "0xf5Be6D3a408F06F00F2d6D4BB923fa9b695916f5",
  "quoterAddress": "0x49B91cc934D63ad7c7FC1abA74B7AebCA413deaD",
  "swapRouter": "0x483B27F0cF5AF935371d52A7F810799cD141E3dc",
  "nftDescriptorLibraryAddress": "0x77269839183175Ed26af82d60b0e8a405F9AeD88",
  "nonfungibleTokenPositionDescriptorAddress": "0xc6Ec6a40A965bd1b06157DD2DC959Ab15cEFF1e0",
  "descriptorProxyAddress": "0xa1944Bb261511bB15Ce8CC054d996B3cFfA7f4d6",
  "nonfungibleTokenPositionManagerAddress": "0x3255160392215494bee8B5aBf8C4C40965d0986C",
  "v3MigratorAddress": "0x94D53BC4cb886eDDb9C0426DFc1edB581D2C98B4"
}
```

### Goerli

```json
{
  "v3CoreFactoryAddress": "0x288be1A33bcdfA9A09cCa95CA1eD628A5294e82c",
  "weth9Address": "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  "multicall2Address": "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  "proxyAdminAddress": "0x815BCC87613315327E04e4A3b7c96a79Ae80760c",
  "tickLensAddress": "0x6744951a0DD149A31Df7B6d42eA69607eD692029",
  "quoterAddress": "0xf5Be6D3a408F06F00F2d6D4BB923fa9b695916f5",
  "swapRouter": "0x49B91cc934D63ad7c7FC1abA74B7AebCA413deaD",
  "nftDescriptorLibraryAddress": "0x483B27F0cF5AF935371d52A7F810799cD141E3dc",
  "nonfungibleTokenPositionDescriptorAddress": "0x77269839183175Ed26af82d60b0e8a405F9AeD88",
  "descriptorProxyAddress": "0xc6Ec6a40A965bd1b06157DD2DC959Ab15cEFF1e0",
  "nonfungibleTokenPositionManagerAddress": "0xa1944Bb261511bB15Ce8CC054d996B3cFfA7f4d6",
  "v3MigratorAddress": "0x3255160392215494bee8B5aBf8C4C40965d0986C"
}
```
