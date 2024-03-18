// Usage: ts-node scripts/1inchlimitorder.ts
import Web3 from 'web3';
import {
  seriesNonceManagerContractAddresses,
  ChainId,
  Erc20Facade,
  limirOrderProtocolAdresses,
  LimitOrderBuilder,
  LimitOrderProtocolFacade,
  LimitOrderPredicateBuilder,
  SeriesNonceManagerFacade,
  SeriesNonceManagerPredicateBuilder,
  Web3ProviderConnector,
  PrivateKeyProviderConnector
} from '@1inch/limit-order-protocol-utils';

require('dotenv').config();

async function main() {
  const API_QUOTE_URL = 'https://optimism.api.0x.org/swap/v1/quote';
  console.info(`Fetching swap quote from 0x-API to sell WETH for DAI...`);

  const exchangeOP = '0xdef1abe32c034e558cdd535791643c58a13acc10';
  const apiKey = process.env.ZEROXAPIKEY;

  const usdcTokenAddress = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607';
  const opTokenAddress = '0x4200000000000000000000000000000000000042';
  const wethTokenAddress = '0x4200000000000000000000000000000000000006';

  const walletAddress = process.env.ADDRESS;

  const chainId = ChainId.optimismMainnet;
  let yourInfuraKey = process.env.ALCHEMY;

  let web3: Web3 = new Web3(`https://opt-mainnet.g.alchemy.com/v2/${yourInfuraKey}`);

  const connector = new Web3ProviderConnector(web3);

  //const connector = new PrivateKeyProviderConnector(process.env.PRIVATE_KEY as string, web3 );

  // const connector = new Web3ProviderConnector(web3);
  const contractAddress = limirOrderProtocolAdresses[chainId];
  console.log("contractAddress ", contractAddress);
  const seriesContractAddress = seriesNonceManagerContractAddresses[chainId];

  const limitOrderProtocolFacade = new LimitOrderProtocolFacade(contractAddress, chainId, connector);
  const seriesNonceManagerFacade = new SeriesNonceManagerFacade(seriesContractAddress, chainId, connector);
  const seriesNonceManagerPredicateBuilder = new SeriesNonceManagerPredicateBuilder(seriesContractAddress, chainId, connector);
  const erc20Facade = new Erc20Facade(connector);

  const expiration = 5444440000;
  const nonce = seriesNonceManagerFacade.nonce(NonceSeriesV2.LimitOrderV3, walletAddress);
  console.log("nonce ", nonce);

  // Creates predicate that restricts Limit Order invalidation conditions
  // Because timestampBelowAndNonceEquals is method of another contract arbitraryStaticCall() is necessary
  const simpleLimitOrderPredicate = arbitraryStaticCall(
    seriesNonceManagerPredicateBuilder.facade,
    seriesNonceManagerPredicateBuilder.timestampBelowAndNonceEquals(
      NonceSeriesV2.LimitOrderV3,
      expiration,
      nonce,
      walletAddress,
    ),
  );

  const limitOrderBuilder = new LimitOrderBuilder();

  const limitOrder = limitOrderBuilder.buildLimitOrder({
    makerAssetAddress: usdcTokenAddress,
    takerAssetAddress: opTokenAddress,
    makerAddress: walletAddress,
    makerAmount: '500000000',
    takerAmount: '2000000000000000000',
    predicate: simpleLimitOrderPredicate,
  });

  const limitOrderTypedData = limitOrderBuilder.buildLimitOrderTypedData(limitOrder);
  const limitOrderSignature = limitOrderBuilder.buildOrderSignature(walletAddress, limitOrderTypedData);

  // ... Continue with the rest of your code

  // const callData = limitOrderProtocolFacade.fillLimitOrder({
  //   order: limitOrder,
  //   signature: limitOrderSignature,
  //   makingAmount: '100',
  //   takingAmount: '0',
  //   thresholdAmount: '50'
  // });

  // Send transaction for the order filling
  // Must be implemented
  // sendTransaction({
  //   from: walletAddress,
  //   gas: 210_000, // Set your gas limit
  //   gasPrice: 40000, // Set your gas price
  //   to: contractAddress,
  //   data: callData,
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
