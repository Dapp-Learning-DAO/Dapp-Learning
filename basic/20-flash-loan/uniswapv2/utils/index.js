
// IUniswapV1Factory addr
// // mainnet
// const factory = "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95";

// // testnets
// const ropsten = "0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351";
// const rinkeby = "0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36";
// const kovan = "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30";
// const görli = "0x6Ce570d02D73d4c384b46135E87f8C592A8c86dA";


// UniswapV2Factory addr
// const matics = 0x160A4086CB492cFCcF996650799a908506268ffb
// const others = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f

const hre = require("hardhat");

const IUniswapV1Factory = {
  mainnet: "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95",
  ropsten: "0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351",
  rinkeby: "0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36",
  kovan: "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30",
  görli: "0x6Ce570d02D73d4c384b46135E87f8C592A8c86dA",
}

const UniswapV2Factory = {
  matic: '0x160A4086CB492cFCcF996650799a908506268ffb',
  others: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
}

const WETHAddr = {
  kovan: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
  matic: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
}

const getAddrs = () => {

  let network = hre.hardhatArguments.network;

  if (!IUniswapV1Factory[network]) {
    throw console.error(`Are you deploying to the correct network? (network selected: ${network})`)
  }

  return [IUniswapV1Factory[network], UniswapV2Factory[network] || UniswapV2Factory['others'], WETHAddr[network]]
}

const getTokenAddress = network => (tokenSymbol) => {
  console.log(network);
  // let network = hre.hardhatArguments.network;
  if (tokenSymbol === 'ETH') {
    return '0x0000000000000000000000000000000000000000'
  }

  const mainnet = {
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'TUSD': '0x0000000000085d4780B73119b644AE5ecd22b376',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'KNC': '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
  }

  const rinkeby = {
    'DAI': '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735',
    'WETH': '0xc778417E063141139Fce010982780140Aa0cD5Ab'
  }

  const kovan = {
    'DAI': '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
    'WETH': '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
  }

  const token = {
    mainnet,
    rinkeby,
    kovan
  }

  if (!token[network]) {
    throw console.error(`Token addresses are not known for network ${network}.`)
  }

  if (!token[network][tokenSymbol]) {
    throw console.error(`Token address not known for token ${tokenSymbol}, in network ${network}.`)
  }
  return token[network][tokenSymbol]
}


module.exports = {
  getAddrs,
  getTokenAddress
}