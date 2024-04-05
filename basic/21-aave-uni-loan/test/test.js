const { expect } = require("chai");

// ethereum mainnet addresses
let daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
let wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
let usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

let lendingPoolAddressesProviderAddress = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
let uniswapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"

let wethGatewayAddress = "0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9"

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

  describe("Best pool fee", function() {
    it("WEH/DAI Pool fee 0.3%", async function() {
      expect(Number(await aaveApe.getBestPoolFee(wethAddress, daiAddress))).to.be.oneOf([500, 3000, 10000]);
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
      await expect(aaveApe['ape'](wethAddress, daiAddress, interestRateMode)).to.emit(aaveApe, 'Ape');

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
