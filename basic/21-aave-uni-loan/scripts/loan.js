require('@nomiclabs/hardhat-waffle');
const { use, expect } = require('chai');

// matic address
//https://docs.aave.com/developers/v/2.0/deployed-contracts/matic-polygon-market
let daiAddress = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
let wethAddress = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; //wmatic
let usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let lendingPoolAddressesProviderAddress = '0xd05e3E715d945B59290df0ae8eF85c1BdB684744';

//sushi
let uniswapRouterAddress = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506';

let wethGatewayAddress = '0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97';

// Fill in your address
const aaveApeAddress = '0xddb2d92d5a0EDcb03c013322c7BAe92734AA4597';

const depositEthInAave = async (pooladdress, _userAddress, _amount) => {
  const ethGateway = await ethers.getContractAt('WETHGateway', wethGatewayAddress);
  let metadata = {
    value: ethers.utils.parseEther(_amount),
  };
  let ethDeposit = await ethGateway.depositETH(pooladdress, _userAddress, 0, metadata);
  await ethDeposit.wait();
  console.log('eth deposit successfully');
};

const withdrawEthInAave = async (pooladdress, _userAddress, _amount) => {
  const ethGateway = await ethers.getContractAt('WETHGateway', wethGatewayAddress);

  let ethWithdraw = await ethGateway.withdrawETH(pooladdress, _amount, _userAddress);
  await ethWithdraw.wait();
  console.log('eth withdraw successfully');
};

const getLendingPool = async () => {
  const lendingPoolAddressesProvider = await ethers.getContractAt('ILendingPoolAddressesProvider', lendingPoolAddressesProviderAddress);
  let lendingPoolAddress = await lendingPoolAddressesProvider['getLendingPool']();
  let lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress);

  return lendingPool;
};

const getAToken = async (_asset) => {
  let lendingPool = await getLendingPool();
  let assetReserveData = await lendingPool['getReserveData'](_asset);
  let assetAToken = await ethers.getContractAt('IAToken', assetReserveData.aTokenAddress);

  return assetAToken;
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

const delegateCreditToTheApe = async (_asset, _interestRateMode = 2) => {
  let assetDebtToken = await getDebtToken(_asset, _interestRateMode);
  console.log('assetDebtToken: ', assetDebtToken.address);
  let assetDebtApproval = await assetDebtToken['approveDelegation'](aaveApeAddress, ethers.constants.MaxUint256);
  await assetDebtApproval.wait();
  console.log('assetDebtApproval successfully  ');
};

main = async () => {
  const [deployer] = await ethers.getSigners();
  let userAddress = deployer.address;
  console.log(userAddress);
  const aaveApe = await ethers.getContractAt('AaveApe', aaveApeAddress);
  let weth = await ethers.getContractAt('IERC20', wethAddress);

  //const lendingpool = await aaveApe.LENDING_POOL()
  const lendingpool = await getLendingPool();
  console.log('lendingpool:', lendingpool.address);
  let reserveData = await aaveApe.getAaveAssetReserveData(daiAddress);

  // variable debt
  let interestRateMode = 2;

  //0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97
  await depositEthInAave(lendingpool.address, deployer.address, '0.1');

  await delegateCreditToTheApe(daiAddress, interestRateMode);

  let result = await aaveApe.getAvailableBorrowInAsset(daiAddress, deployer.address);
  console.log('available borrow: ', result.toString());
  console.log('begin ape');

  //tx =   await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)
  tx = await aaveApe['superApe'](wethAddress, daiAddress, interestRateMode, 1);
  await tx.wait();

  let aToken = await getAToken(wethAddress);
  // console.log("aToken: ", aToken)
  let debtToken = await getDebtToken(daiAddress, interestRateMode, true);
  // console.log("debtToken: ", debtToken)
  tx = await aToken.approve(aaveApe.address, ethers.constants.MaxUint256);
  await tx.wait();
  console.log('atoken approve successfully. ');

  let aBalanceBefore = await aToken.balanceOf(userAddress);
  console.log('aBalanceBefore: ', aBalanceBefore.toString());
  let debtBalanceBefore = await debtToken.balanceOf(userAddress);
  console.log('debtBalanceBefore: ', debtBalanceBefore.toString());

  tx = await aaveApe['unwindApe'](wethAddress, daiAddress, interestRateMode);
  await tx.wait();

  let aBalanceAfter = await aToken.balanceOf(userAddress);
  console.log('aBalanceAfter: ', aBalanceAfter.toString());
  let debtBalanceAfter = await debtToken.balanceOf(userAddress);
  console.log('debtBalanceAfter: ', debtBalanceAfter.toString());

  await aToken.approve(wethGatewayAddress,ethers.constants.MaxUint256 )
  await withdrawEthInAave(lendingpool.address, userAddress, aBalanceAfter)
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
