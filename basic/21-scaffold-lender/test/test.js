require("@nomiclabs/hardhat-waffle");
const { use, expect } = require("chai");

let daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
let wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
let usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

let lendingPoolAddressesProviderAddress = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
let uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

let wethGatewayAddress = "0xDcD33426BA191383f1c9B431A342498fdac73488"

const depositEthInAave = async (_userAddress, _amount) => {

  const ethGateway = await ethers.getContractAt('WETHGateway', wethGatewayAddress)
  let metadata = {
    value: ethers.utils.parseEther(_amount)
  }
  let ethDeposit = await ethGateway['depositETH'](_userAddress, 0, metadata)
}

const getLendingPool = async () => {

  const lendingPoolAddressesProvider = await ethers.getContractAt('ILendingPoolAddressesProvider', lendingPoolAddressesProviderAddress)
  let lendingPoolAddress = await lendingPoolAddressesProvider['getLendingPool']()
  let lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress)

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
  let assetDebtApproval = await assetDebtToken['approveDelegation'](aaveApe.address, ethers.constants.MaxUint256)
}

describe("AaveApe", function () {

  beforeEach(async () => {

    const AaveApe = await ethers.getContractFactory("AaveApe");
    aaveApe = await AaveApe.deploy(lendingPoolAddressesProviderAddress, uniswapRouterAddress);

    const [user] = await ethers.getSigners();
    userAddress = user.address

    });

  describe("Address verification", function () {

    it("ROUTER_ADDRESS", async function () {
      expect(await aaveApe.UNISWAP_ROUTER()).to.equal(uniswapRouterAddress)
    })

    it("LENDING_POOL", async function () {
    const _lendingPoolAddressesProvider = await ethers.getContractAt('ILendingPoolAddressesProvider', lendingPoolAddressesProviderAddress)
    _lendingPoolAddress = await _lendingPoolAddressesProvider['getLendingPool']()
    expect(await aaveApe.LENDING_POOL()).to.equal(_lendingPoolAddress);
  })

  })

  describe("Going ape", function () {
    it("Revert if the user has no collateral", async function () {

      await expect(aaveApe['ape'](wethAddress, daiAddress, 2)).to.be.reverted;

    })

    it("Revert if the user has not delegated credit to the Ape", async function () {

      await depositEthInAave(userAddress, "5")
      await expect(aaveApe['ape'](wethAddress, daiAddress, 2)).to.be.reverted;

    })

    it("Succeeds if the user has collateral & has delegated credit", async function () {
      let interestRateMode = 2

      await depositEthInAave(userAddress, "5")
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

      await depositEthInAave(userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)
      await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)
      await expect(aaveApe['unwindApe'](wethAddress, daiAddress, interestRateMode)).to.be.reverted;

    })

    it("Revert if the user does not have enough apeAsset collateral to repay the debt", async function () {

      let interestRateMode = 2

      await depositEthInAave(userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)

      // Go long USDC, which we don't have deposited
      await aaveApe['ape'](usdcAddress, daiAddress, interestRateMode)

      // When we go to unwind, we don't have enough USDC to pay our debt
      await expect(aaveApe['unwindApe'](usdcAddress, daiAddress, interestRateMode)).to.be.reverted;

    })

    it("Success if the user has debt, has approved and has enough collateral", async function () {

      let interestRateMode = 2

      await depositEthInAave(userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)
      await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)

      let aToken = await getAToken(wethAddress)
      let debtToken = await getDebtToken(daiAddress, interestRateMode, true)

      await aToken.approve(aaveApe.address, ethers.constants.MaxUint256)

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
