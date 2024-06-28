const {network, config} = require('hardhat');

const networkAddressMapping = config.networkAddressMapping;

// check addressMapping has the network
if (!networkAddressMapping[network.name]) {
  throw new Error('network ' + network.name + ' dont config in the addressMapping, please add it');
}

const {
  daiAddress,
  wethAddress,

  lendingPoolAddressesProviderAddress,
  uniswapRouterAddress,
  wethGatewayAddress,
  aaveApeAddress
} = networkAddressMapping[network.name];


const depositEthInAave = async (pooladdress, _userAddress, _amount) => {
  const ethGateway = await ethers.getContractAt('IWrappedTokenGatewayV3', wethGatewayAddress);
  let metadata = {
    value: ethers.parseEther(_amount),
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
  console.log('assetDebtToken: ', assetDebtToken.target);
  let assetDebtApproval = await assetDebtToken['approveDelegation'](aaveApeAddress, ethers.MaxUint256);
  await assetDebtApproval.wait();
  console.log('assetDebtApproval successfully  ');
};

main = async () => {
  const [deployer] = await ethers.getSigners()

  let userAddress = deployer.address;
  console.log("user address:", userAddress)

  const aaveApe = await ethers.getContractAt('AaveApePlus', aaveApeAddress);

  const lendingpool = await getLendingPool();
  console.log('lendingpool:', lendingpool.target);
  let reserveData = await aaveApe.getAaveAssetReserveData(daiAddress);

  // variable debt
  let interestRateMode = 2;

  await depositEthInAave(lendingpool.target, userAddress, '0.1'); 
  await delegateCreditToTheApe(daiAddress, interestRateMode);

  // let result = await aaveApe.getAvailableBorrowInAsset(daiAddress, userAddress);
  // console.log('available borrow: ', result.toString());
  console.log('begin ape');

  //tx =   await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)
  // tx = await aaveApe['superApe'](wethAddress, daiAddress, interestRateMode, 1);

  let borrowAmount = ethers.parseEther("1000"); // 1000 DAI with 18 decimals 
  tx = await aaveApe['flashApe'](wethAddress, daiAddress, borrowAmount, interestRateMode);
  await tx.wait();

  let aToken = await getAToken(wethAddress);
  let debtToken = await getDebtToken(daiAddress, interestRateMode, true);
  // console.log("debtToken: ", debtToken)
  
  tx = await aToken.approve(aaveApe.target, ethers.MaxUint256);
  await tx.wait();
  console.log('atoken approve successfully. ');

  let aBalanceBefore = await aToken.balanceOf(userAddress);
  console.log('aBalanceBefore: ', aBalanceBefore.toString());
  let debtBalanceBefore = await debtToken.balanceOf(userAddress);
  console.log('debtBalanceBefore: ', debtBalanceBefore.toString());

  tx = await aaveApe['flashUnwind'](wethAddress, daiAddress, borrowAmount, interestRateMode);
  await tx.wait();

  let aBalanceAfter = await aToken.balanceOf(userAddress);
  console.log('aBalanceAfter: ', aBalanceAfter.toString());
  let debtBalanceAfter = await debtToken.balanceOf(userAddress);
  console.log('debtBalanceAfter: ', debtBalanceAfter.toString());

  await aToken.approve(wethGatewayAddress,ethers.MaxUint256 )
  console.log('atoken approve successfully. ');

  await withdrawEthInAave(lendingpool.target, userAddress, aBalanceAfter)
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
