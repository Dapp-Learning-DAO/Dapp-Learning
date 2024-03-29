require('@nomiclabs/hardhat-waffle');
const { use, expect } = require('chai');

// https://docs.aave.com/developers/deployed-contracts/v3-mainnet/ethereum-mainnet
let daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
let wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; //weth
let usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let lendingPoolAddressesProviderAddress = '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e';

//uniswap v3 router
let uniswapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

let wethGatewayAddress = '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9'; //WrappedTokenGatewayV3

// Fill in your address
const aaveApeAddress = '0x4Dd5336F3C0D70893A7a86c6aEBe9B953E87c891';

const depositEthInAave = async (pooladdress, _userAddress, _amount) => {
  const ethGateway = await ethers.getContractAt('IWrappedTokenGatewayV3', wethGatewayAddress);
  let metadata = {
    value: ethers.utils.parseEther(_amount),
  };
  let ethDeposit = await ethGateway.depositETH(pooladdress, _userAddress, 0, metadata);
  await ethDeposit.wait();
  console.log('eth deposit successfully');
};

const withdrawEthInAave = async (pooladdress, _userAddress, _amount) => {
  const ethGateway = await ethers.getContractAt('IWrappedTokenGatewayV3', wethGatewayAddress);

  let ethWithdraw = await ethGateway.withdrawETH(pooladdress, _amount, _userAddress);
  await ethWithdraw.wait();
  console.log('eth withdraw successfully');
};

const getLendingPool = async () => {
  const lendingPoolAddressesProvider = await ethers.getContractAt('IPoolAddressesProvider', lendingPoolAddressesProviderAddress);
  let lendingPoolAddress = await lendingPoolAddressesProvider['getPool']();
  let lendingPool = await ethers.getContractAt('IPool', lendingPoolAddress);

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
  const [deployer] = await ethers.getSigners()
  console.log("user address:", deployer.address)

  let userAddress = deployer.address;
  const aaveApe = await ethers.getContractAt('AaveApe', aaveApeAddress);

  const lendingpool = await getLendingPool();
  console.log('lendingpool:', lendingpool.address);
  let reserveData = await aaveApe.getAaveAssetReserveData(daiAddress);

  // variable debt
  let interestRateMode = 2;

  //0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
  await depositEthInAave(lendingpool.address, deployer.address, '0.1'); 

  await delegateCreditToTheApe(daiAddress, interestRateMode);

  let result = await aaveApe.getAvailableBorrowInAsset(daiAddress, deployer.address);
  console.log('available borrow: ', result.toString());
  console.log('begin ape');

  //tx =   await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)
  tx = await aaveApe['superApe'](wethAddress, daiAddress, interestRateMode, 1);
  await tx.wait();

  let aToken = await getAToken(wethAddress);
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
