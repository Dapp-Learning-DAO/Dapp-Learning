const { expect } = require("chai");
const {network, config, ethers} = require('hardhat');

const networkAddressMapping = config.networkAddressMapping;

// check addressMapping has the network
if (!networkAddressMapping[network.name]) {
  throw new Error('network ' + network.name + ' dont config in the addressMapping, please add it');
}

const {
  daiAddress,
  wethAddress,
  usdcAddress,
  wbtcAddress,
 
  lendingPoolAddressesProviderAddress,
  uniswapRouterAddress,
  wethGatewayAddress,

  augustusRegistryAddress
} = networkAddressMapping[network.name];

const augustusSwapAddrss = "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57";

const daiToWethCalldata = "0x46c67b6d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000878678326eac9000000000000000000000000000000000000000000000000000000ad701b19da6dea7c000000000000000000000000000000000000000000000000b2cd4e155fdd8588000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000009abf798f5314bfd793a9e57a654bed35af4a1d6001000000000000000000000000000000000000000000000000000000000313880000000000000000000000000000000000000000000000000000000000000b4000000000000000000000000000000000000000000000000000000000664b46a7a1e6aaaf37804a758f2535729c907e35000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000001b5800000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000baeeb4540f59d30e567a5b563cc0c4587edd936600000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000900000000000000000000000089b78cfa322f6c5de0abceecab66aee45393cc5a000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000a59649758aa4d66e25f08dd01271e891fe521990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e8d4a51000000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000009be264469ef954c139da4a45cf76cbcc5e3a6a73000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000066542cc6000000000000000000000000000000000000000000000000000000000000002ba0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000009be264469ef954c139da4a45cf76cbcc5e3a6a73000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000066542cc600000000000000000000000000000000000000000000000000000000000000426b175474e89094c44da98b954eedeac495271d0f000064dac17f958d2ee523a2206206994597c13d831ec7000064c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const wethToDaicallData = "0x2298207a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000b8eb8bd269726e02000000000000000000000000000000000000000000000878678326eac9000000000000000000000000000000000000000000000000000000b388b9754b0931a400000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000003a0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009abf798f5314bfd793a9e57a654bed35af4a1d600100000000000000000000000000000000000000000000000000000000031388000000000000000000000000000000000000000000000000000000000000044000000000000000000000000000000000000000000000000000000000664b511cddf2537c100e4df48fa2a52b040b3fc4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000e592427a0aece92de3edee1f18e0157c058615640000000000000000000000000000000000000000000000000000000000000144f28c0498000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee57000000000000000000000000000000000000000000000000000000006654373b000000000000000000000000000000000000000000000878678326eac9000000000000000000000000000000000000000000000000000000b8eb8bd269726e0000000000000000000000000000000000000000000000000000000000000000426b175474e89094c44da98b954eedeac495271d0f000064dac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000144000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const depositEthInAave = async (_poolAddress, _userAddress, _amount) => {
  // console.log("isAddressable", _poolAddress, _userAddress, ethers.isAddressable(_poolAddress), ethers.isAddressable(_userAddress))
  const ethGateway = await ethers.getContractAt('IWrappedTokenGatewayV3', wethGatewayAddress)
  let metadata = {
    value: ethers.parseEther(_amount)
  }

  let ethDeposit = await ethGateway.depositETH(_poolAddress, _userAddress, 0, metadata)
  // console.log('eth deposit successfully');
}

const supplyWbtcInAave = async (_userAddress, _amount) => {
  const lendingPool = await getLendingPool();
  await lendingPool['supply'](wbtcAddress, _amount, _userAddress, 0);
}

const swapEthToWbtc = async (_amount, _userAddress) => {
  const uniswapRouter = await ethers.getContractAt('ISwapRouter', uniswapRouterAddress)
  //swap use uniswap v3 ISwapRouter exactOutputSingle
  const deadline = Math.floor(Date.now() / 1000) + 60;
  const recipient = _userAddress;
  const sqrtPriceLimitX96 = 0;
  const amountIn = await uniswapRouter.exactOutputSingle({
    tokenIn: wethAddress,
    tokenOut: wbtcAddress,
    fee: 3000,
    recipient,
    deadline,
    amountOut: _amount,
    amountInMaximum: ethers.MaxUint256,
    sqrtPriceLimitX96,
  });

  return amountIn;
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

const getParaSwapCalldata = (from, to, _amount, calldata) => {
  let paraswapCalldata = [
    augustusSwapAddrss,
    from,
    to,
    _amount,
    ethers.getBytes(calldata)
  ]
  return paraswapCalldata;
}


describe("AaveApePlusV2", function () {

  beforeEach(async () => {

    const AaveApe = await ethers.getContractFactory("AaveApePlusV2");
    aaveApe = await AaveApe.deploy(lendingPoolAddressesProviderAddress, uniswapRouterAddress, augustusRegistryAddress);
    const [user] = await ethers.getSigners();
    userAddress = user.address;
    const lendingpool = await getLendingPool();
    pooladdress = lendingpool.target;
  });

  describe("Address verification", function () {

    it("ROUTER_ADDRESS", async function () {
      expect(await aaveApe.UNISWAP_ROUTER()).to.equal(uniswapRouterAddress)
    })

    it("AUGUSTUS_REGISTRY", async function () {
      expect(await aaveApe.AUGUSTUS_REGISTRY()).to.equal(augustusRegistryAddress)
    })

    it("LENDING_POOL", async function () {
      const _lendingPoolAddressesProvider = await ethers.getContractAt('IPoolAddressesProvider', lendingPoolAddressesProviderAddress)
      _lendingPoolAddress = await _lendingPoolAddressesProvider['getPool']()
      expect(await aaveApe.LENDING_POOL()).to.equal(_lendingPoolAddress);
    })

  })

  describe("Going flash ape", function () {
    it("Revert if the user has no collateral", async function () {

      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        1,
        daiToWethCalldata
      )

      await expect(aaveApe['flashApe'](wethAddress, daiAddress, 1, 2, paraswapCalldata)).to.be.reverted;

    })

    it("Revert if the user has not delegated credit to the Ape", async function () {

      await depositEthInAave(pooladdress, userAddress, "5")
      let borrowAmount = ethers.parseEther('40000') //borrow 40000 DAI

      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        borrowAmount,
        daiToWethCalldata
      )

      await expect(aaveApe['flashApe'](wethAddress, daiAddress, borrowAmount, 2, paraswapCalldata)).to.be.reverted;
    })

    it("Succeeds flash ape, looooooooooooping", async function () {
      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)

      let aToken = await getAToken(wethAddress)
      let debtToken = await getDebtToken(daiAddress, interestRateMode, true)

      let aBalanceBefore = await aToken.balanceOf(userAddress)
      let debtBalanceBefore = await debtToken.balanceOf(userAddress)

      let borrowAmount = ethers.parseEther('40000') //borrow 40000 DAI

      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        borrowAmount,
        daiToWethCalldata
      )

      await expect(aaveApe['flashApe'](wethAddress, daiAddress, borrowAmount, interestRateMode, paraswapCalldata)).to.emit(aaveApe, 'Ape')

      let aBalanceAfter = await aToken.balanceOf(userAddress)
      let debtBalanceAfter = await debtToken.balanceOf(userAddress)

      expect(aBalanceAfter > aBalanceBefore)
      expect(debtBalanceAfter > debtBalanceBefore)
    })
  })

  
  describe("flash unwind an ape", function () {
    
    it("Revert if there is no collateral", async function () {
      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        1,
        daiToWethCalldata
      )
      await expect(aaveApe['flashUnwind'](wethAddress, daiAddress, 1, 2, paraswapCalldata)).to.be.reverted;
    })

    it("Revert if there is no debt to repay", async function () {
      await depositEthInAave(pooladdress, userAddress, "5")

      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        1,
        daiToWethCalldata
      )

      await expect(aaveApe['flashUnwind'](wethAddress, daiAddress, 1, 2, paraswapCalldata)).to.be.reverted;
    })

    it("Revert if the user has not given Aave Ape an allowance on the aToken", async function () {
      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)

      let borrowAmount = ethers.parseEther('40000') //borrow 40000 DAI

      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        borrowAmount,
        daiToWethCalldata
      )

      await aaveApe['flashApe'](wethAddress, daiAddress, borrowAmount, interestRateMode, paraswapCalldata)

      paraswapCalldata = getParaSwapCalldata(
        wethAddress,
        daiAddress,
        borrowAmount,
        wethToDaicallData
      )

      await expect(aaveApe['flashUnwind'](wethAddress, daiAddress, borrowAmount, interestRateMode, paraswapCalldata)).to.be.reverted;
    })

    it("Success if the user has debt, has approved and has enough collateral", async function () {

      let interestRateMode = 2

      await depositEthInAave(pooladdress, userAddress, "5")
      await delegateCreditToTheApe(daiAddress, interestRateMode)

      let borrowAmount = ethers.parseEther('40000')

      let paraswapCalldata = getParaSwapCalldata(
        daiAddress,
        wethAddress,
        borrowAmount,
        daiToWethCalldata
      )

      await aaveApe['flashApe'](wethAddress, daiAddress, borrowAmount, interestRateMode, paraswapCalldata)

      let aToken = await getAToken(wethAddress)
      let debtToken = await getDebtToken(daiAddress, interestRateMode, true)

      await aToken.approve(aaveApe.target, ethers.MaxUint256)

      let aBalanceBefore = await aToken.balanceOf(userAddress)
      let debtBalanceBefore = await debtToken.balanceOf(userAddress)
      
      paraswapCalldata = getParaSwapCalldata(
        wethAddress,
        daiAddress,
        borrowAmount,
        wethToDaicallData
      )

      await expect(aaveApe['flashUnwind'](wethAddress, daiAddress, borrowAmount, interestRateMode, paraswapCalldata)).to.emit(aaveApe, 'Ape');

      let aBalanceAfter = await aToken.balanceOf(userAddress)
      let debtBalanceAfter = await debtToken.balanceOf(userAddress)

      expect(aBalanceAfter < aBalanceBefore)
      expect(debtBalanceAfter === 0)
    })

  })

});
