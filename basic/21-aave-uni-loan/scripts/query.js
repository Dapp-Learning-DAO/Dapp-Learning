require('@nomiclabs/hardhat-waffle');
const { BigNumber } = require('@ethersproject/bignumber');
const { use, expect } = require('chai');

let exp = BigNumber.from("10").pow(18);
let exp1 = BigNumber.from("10").pow(27);

// matic address
//https://docs.aave.com/developers/v/2.0/deployed-contracts/matic-polygon-market
let daiAddress = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
let wmaticAddress = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; //wmatic
 let wethAddress = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; //weth
 let wbtcAddress = '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'; //weth
let usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let lendingPoolAddressesProviderAddress = '0xd05e3E715d945B59290df0ae8eF85c1BdB684744';

//sushi
let uniswapRouterAddress = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506';

let wethGatewayAddress = '0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97';

// Fill in your address
const aaveApeAddress = '0xddb2d92d5a0EDcb03c013322c7BAe92734AA4597';


const getAToken = async (_asset) => {
  let lendingPool = await getLendingPool();
  let assetReserveData = await lendingPool['getReserveData'](_asset);
  let assetAToken = await ethers.getContractAt('IAToken', assetReserveData.aTokenAddress);

  return assetAToken;
};

const getLendingPool = async () => {
  const lendingPoolAddressesProvider = await ethers.getContractAt('ILendingPoolAddressesProvider', lendingPoolAddressesProviderAddress);
  let lendingPoolAddress = await lendingPoolAddressesProvider['getLendingPool']();
  let lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress);

  return lendingPool;
};

const getDebtToken = async (_asset, _interestRateMode, erc20 = false) => {
  let lendingPool = await getLendingPool();

  let assetReserveData = await lendingPool['getReserveData'](_asset);
  let assetDebtToken;

  if (_interestRateMode === 1) {
    let interface = erc20 === true ? 'IERC20' : 'IStableDebtToken';
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.stableDebtTokenAddress);
  } else {
    let interface = erc20 === true ? 'IERC20' : 'IVariableDebtToken';
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.variableDebtTokenAddress);
  }

  return assetDebtToken;
};


main = async () => {
  const [deployer] = await ethers.getSigners();
  let  fish = "XXX"
  let userAddress = deployer.address;
   console.log(userAddress);
   const aaveApe = await ethers.getContractAt('AaveApe', aaveApeAddress);

  const lendingPool = await getLendingPool();
  console.log('lendingPool:', lendingPool.address);
  let reserveData = await aaveApe.getAaveAssetReserveData(usdcAddress);
  //console.log("usdc reserveData: " , reserveData )

  // variable debt
  let interestRateMode = 2;

  let useraccount =  await lendingPool.getUserAccountData(fish);


 // console.log("userdata: ", useraccount); 
  console.log("healthFactor: ", useraccount.healthFactor.mul(BigNumber.from("100")).div(exp).toString()); 
  console.log("totalCollateralETH: ", useraccount.totalCollateralETH.div(exp).toString()); 
  console.log("currentLiquidationThreshold: ", useraccount.currentLiquidationThreshold.toString()); 
  console.log("ltv: ", useraccount.ltv.toString()); 
  
  let reserveData1 =  await lendingPool.getReserveData(usdcAddress);
  console.log("usdc borrow  variable rate: ", reserveData1.currentVariableBorrowRate.mul(BigNumber.from("10000")).div(exp1).toString());
  //console.log("usdc borrow stable rate: ", reserveData1.currentStableBorrowRate.mul(BigNumber.from("10000")).div(exp1).toString());
  console.log("usdc deposit rate: ", reserveData1.currentLiquidityRate.mul(BigNumber.from("10000")).div(exp1).toString());
  console.log("usdc borrow index: ", reserveData1.variableBorrowIndex.mul(BigNumber.from("10000")).div(exp1).toString());

  let result = await aaveApe.getAvailableBorrowInAsset(usdcAddress, fish);
  console.log('available borrow usdc: ', result.toString());


  let aToken = await getAToken(wethAddress);
  let aTokenbtc = await getAToken(wbtcAddress);
  // console.log("aToken: ", aToken)
  let debtToken = await getDebtToken(usdcAddress, interestRateMode, true);
  // console.log("debtToken: ", debtToken)
 
  let aBalanceBefore = await aToken.balanceOf(fish);
  console.log('aBalanceBefore: ', aBalanceBefore.toString());
  let aBalancebtcBefore = await aTokenbtc.balanceOf(fish);
  console.log('aBalancebtcBefore: ', aBalancebtcBefore.toString());
  let debtBalanceBefore = await debtToken.balanceOf(fish);
  console.log('debtBalanceBefore: ', debtBalanceBefore.toString());

  // todo  get fee by graph 
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  19519327207+30213257800

  19519327207
  20000