const { expect } = require("chai");
const {network, config} = require('hardhat');

const networkAddressMapping = config.networkAddressMapping;

// check addressMapping has the network
if (!networkAddressMapping[network.name]) {
  throw new Error('network ' + network.name + ' dont config in the addressMapping, please add it');
}

const {
  daiAddress,
  wethAddress,
  usdcAddress,
 
  lendingPoolAddressesProviderAddress,
  uniswapRouterAddress,
  wethGatewayAddress
} = networkAddressMapping[network.name];

const depositEthInAave = async (_poolAddress, _userAddress, _amount) => {
  // console.log("isAddressable", _poolAddress, _userAddress, ethers.isAddressable(_poolAddress), ethers.isAddressable(_userAddress))
  const ethGateway = await ethers.getContractAt('IWrappedTokenGatewayV3', wethGatewayAddress)
  let metadata = {
    value: ethers.parseEther(_amount)
  }

  let ethDeposit = await ethGateway.depositETH(_poolAddress, _userAddress, 0, metadata)
  // console.log('eth deposit successfully');
}

const getLendingPool = async () => {

  const lendingPoolAddressesProvider = await ethers.getContractAt('IPoolAddressesProvider', lendingPoolAddressesProviderAddress)
  let lendingPoolAddress = await lendingPoolAddressesProvider['getPool']()
  let lendingPool = await ethers.getContractAt('IPool', lendingPoolAddress)

  return lendingPool
}

const getAToken = async (_asset) => {

  let lendingPool = await getLendingPool()
  let assetReserveData = await lendingPool['getReserveData'](_asset)
  let assetAToken = await ethers.getContractAt('IAToken', assetReserveData.aTokenAddress)

  return assetAToken
}

const getDebtToken = async (_asset, _interestRateMode, erc20=false) => {

  let lendingPool = await getLendingPool()

  let assetReserveData = await lendingPool['getReserveData'](_asset)
  let assetDebtToken

  if(_interestRateMode === 1) {
    let interface = erc20===true?'IERC20':'IStableDebtToken'
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.stableDebtTokenAddress)
  } else {
    let interface = erc20===true?'IERC20':'IVariableDebtToken'
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.variableDebtTokenAddress)
  }

  return assetDebtToken
}

const delegateCreditToTheApe = async (_asset, _interestRateMode = 2) => {

  let assetDebtToken = await getDebtToken(_asset, _interestRateMode)
  let assetDebtApproval = await assetDebtToken['approveDelegation'](aaveApe.target, ethers.MaxUint256)
}

describe("AaveApe", function () {

  beforeEach(async () => {

    const AaveApe = await ethers.getContractFactory("AaveApe");
    aaveApe = await AaveApe.deploy(lendingPoolAddressesProviderAddress, uniswapRouterAddress);
    const [user] = await ethers.getSigners();
    userAddress = user.address;
    const lendingpool = await getLendingPool();
    pooladdress = lendingpool.target;
  });

  describe("Address verification", function () {

    it("ROUTER_ADDRESS", async function () {
      expect(await aaveApe.UNISWAP_ROUTER()).to.equal(uniswapRouterAddress)
    })

    it("LENDING_POOL", async function () {
      const _lendingPoolAddressesProvider = await ethers.getContractAt('IPoolAddressesProvider', lendingPoolAddressesProviderAddress)
      _lendingPoolAddress = await _lendingPoolAddressesProvider['getPool']()
      expect(await aaveApe.LENDING_POOL()).to.equal(_lendingPoolAddress);
    })

  })

  describe("get max liquidity pool", function() {
    it("get max liquidity pool of WEH/DAI", async function() {
      expect(await aaveApe.getBestPool(wethAddress, daiAddress)).to.not.equal("0x0000000000000000000000000000000000000000");
    })
  })

  describe("Going ape", function () {
    it("Revert if the user has no collateral", async function () {

      await expect(aaveApe['ape'](wethAddress, daiAddress, 2)).to.be.reverted;

    })

    it("Revert if the user has not delegated credit to the Ape", async function () {

      await depositEthInAave(pooladdress, userAddress, "5")
      await expect(aaveApe['ape'](wethAddress, daiAddress, 2)).to.be.reverted;

    })

    it("Succeeds if the user has collateral & has delegated credit", async function () {
      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)

      let aToken = await getAToken(wethAddress)
      let debtToken = await getDebtToken(daiAddress, interestRateMode, true)

      let aBalanceBefore = await aToken.balanceOf(userAddress)
      let debtBalanceBefore = await debtToken.balanceOf(userAddress)
      await expect(aaveApe['ape'](wethAddress, daiAddress, interestRateMode)).to.emit(aaveApe, 'Ape')

      let aBalanceAfter = await aToken.balanceOf(userAddress)
      let debtBalanceAfter = await debtToken.balanceOf(userAddress)

      expect(aBalanceAfter > aBalanceBefore)
      expect(debtBalanceAfter > debtBalanceBefore)
    })
  })

  describe("Unwinding an ape", function () {
    it("Revert if there is no debt to repay", async function () {

      await expect(aaveApe['unwindApe'](wethAddress, daiAddress, 2)).to.be.reverted;

    })

    it("Revert if the user has not given Aave Ape an allowance on the aToken", async function () {

      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)
      await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)
      await expect(aaveApe['unwindApe'](wethAddress, daiAddress, interestRateMode)).to.be.reverted;

    })

    it("Revert if the user does not have enough apeAsset collateral to repay the debt", async function () {

      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)

      // Go long USDC, which we don't have deposited
      await aaveApe['ape'](usdcAddress, daiAddress, interestRateMode)

      // When we go to unwind, we don't have enough USDC to pay our debt
      await expect(aaveApe['unwindApe'](usdcAddress, daiAddress, interestRateMode)).to.be.reverted;

    })

    it("Success if the user has debt, has approved and has enough collateral", async function () {

      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)
      await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)

      let aToken = await getAToken(wethAddress)
      let debtToken = await getDebtToken(daiAddress, interestRateMode, true)

      await aToken.approve(aaveApe.target, ethers.MaxUint256)

      let aBalanceBefore = await aToken.balanceOf(userAddress)
      let debtBalanceBefore = await debtToken.balanceOf(userAddress)

      await expect(aaveApe['unwindApe'](wethAddress, daiAddress, interestRateMode)).to.emit(aaveApe, 'Ape');

      let aBalanceAfter = await aToken.balanceOf(userAddress)
      let debtBalanceAfter = await debtToken.balanceOf(userAddress)

      expect(aBalanceAfter < aBalanceBefore)
      expect(debtBalanceAfter === 0)

    })
  })
});
