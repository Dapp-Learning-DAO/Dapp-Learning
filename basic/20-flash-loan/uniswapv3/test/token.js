const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const { BigNumber } = require('ethers')
const { computePoolAddress } = require('./computePoolAddress')

describe("uniswap v3 contract test", function() {

  FeeAmount = {
    LOW:    500,
    MEDIUM: 3000,
    HIGH:   10000
  }

  TICK_SPACINGS = {
    [FeeAmount.LOW]: 10,
    [FeeAmount.MEDIUM]: 60,
    [FeeAmount.HIGH]: 200,
  }

  const MaxUint128 = BigNumber.from(2).pow(128).sub(1)

  before(async function() {
    [owner, alice, bob] = await ethers.getSigners();


    WETH9 = await ethers.getContractFactory("WETH9");
    weth9 = await WETH9.deploy();

    const tokenFactory = await ethers.getContractFactory('contracts/uniswap-v3-periphery/contracts/test/TestERC20.sol:TestERC20')
    tokens = [
      await tokenFactory.deploy(ethers.constants.MaxUint256.div(2)),
      await tokenFactory.deploy(ethers.constants.MaxUint256.div(2)),
      await tokenFactory.deploy(ethers.constants.MaxUint256.div(2))
    ]

    const UniswapV3Factory = await ethers.getContractFactory("UniswapV3Factory");
    factory = await UniswapV3Factory.deploy();

    MockTimeSwapRouter = await ethers.getContractFactory("MockTimeSwapRouter");
    mockTimeSwapRouter = await MockTimeSwapRouter.deploy(factory.address, weth9.address);

    const nftDescriptorLibraryFactory = await ethers.getContractFactory('NFTDescriptor')
    const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy()
    positionDescriptorFactory = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
      libraries: {
        NFTDescriptor: nftDescriptorLibrary.address,
      }
    });
    const nftDescriptor = await positionDescriptorFactory.deploy(tokens[0].address)

    PositionManagerFactory = await ethers.getContractFactory('MockTimeNonfungiblePositionManager');
    nft = await PositionManagerFactory.deploy(factory.address, weth9.address, nftDescriptor.address);
    
    tokens.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1))

    const quoterFactory = await ethers.getContractFactory('Quoter')
    quoter = await quoterFactory.deploy(factory.address, weth9.address);

    const flashContractFactory = await ethers.getContractFactory('PairFlash');
    flash = (await flashContractFactory.deploy(mockTimeSwapRouter.address, factory.address, weth9.address));
  });

  it("create pool", async () => {
    await tokens[0].approve(nft.address, MaxUint128)
    await tokens[1].approve(nft.address, MaxUint128)
    await createPool(tokens[0].address, tokens[1].address, FeeAmount.LOW, encodePriceSqrt(5, 10))
    await createPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM, encodePriceSqrt(1, 1))
    await createPool(tokens[0].address, tokens[1].address, FeeAmount.HIGH, encodePriceSqrt(20, 10))
  })

  it("flash", async function() {
    // choose amountIn to test
    const amount0In = 1000
    const amount1In = 1000

    const fee0 = Math.ceil((amount0In * FeeAmount.MEDIUM) / 1000000)
    const fee1 = Math.ceil((amount1In * FeeAmount.MEDIUM) / 1000000)

    const flashParams = {
      token0: tokens[0].address,
      token1: tokens[1].address,
      fee1: FeeAmount.MEDIUM,
      amount0: amount0In,
      amount1: amount1In,
      fee2: FeeAmount.LOW,
      fee3: FeeAmount.HIGH,
    }
    // pool1 is the borrow pool
    const pool1 = computePoolAddress(factory.address, [tokens[0].address, tokens[1].address], FeeAmount.MEDIUM)
    const pool2 = computePoolAddress(factory.address, [tokens[0].address, tokens[1].address], FeeAmount.LOW)
    const pool3 = computePoolAddress(factory.address, [tokens[0].address, tokens[1].address], FeeAmount.HIGH)

    const expectedAmountOut0 = await quoter.callStatic.quoteExactInputSingle(
      tokens[1].address,
      tokens[0].address,
      FeeAmount.LOW,
      amount1In,
      encodePriceSqrt(20, 10)
    )
    const expectedAmountOut1 = await quoter.callStatic.quoteExactInputSingle(
      tokens[0].address,
      tokens[1].address,
      FeeAmount.HIGH,
      amount0In,
      encodePriceSqrt(5, 10)
    )

    await expect(flash.initFlash(flashParams))
      .to.emit(tokens[0], 'Transfer')
      .withArgs(pool1, flash.address, amount0In)
      .to.emit(tokens[1], 'Transfer')
      .withArgs(pool1, flash.address, amount1In)
      .to.emit(tokens[0], 'Transfer')
      .withArgs(pool2, flash.address, expectedAmountOut0)
      .to.emit(tokens[1], 'Transfer')
      .withArgs(pool3, flash.address, expectedAmountOut1)
      .to.emit(tokens[0], 'Transfer')
      .withArgs(flash.address, owner.address, expectedAmountOut0.toNumber() - amount0In - fee0)
      .to.emit(tokens[1], 'Transfer')
      .withArgs(flash.address, owner.address, expectedAmountOut1.toNumber() - amount1In - fee1)
  });

  async function createPool(tokenAddressA, tokenAddressB, fee, price) {
    if (tokenAddressA.toLowerCase() > tokenAddressB.toLowerCase())
      [tokenAddressA, tokenAddressB] = [tokenAddressB, tokenAddressA]

    await nft.createAndInitializePoolIfNecessary(tokenAddressA, tokenAddressB, fee, price)

    const liquidityParams = {
      token0: tokenAddressA,
      token1: tokenAddressB,
      fee: fee,
      tickLower: getMinTick(TICK_SPACINGS[fee]),
      tickUpper: getMaxTick(TICK_SPACINGS[fee]),
      recipient: bob.address,
      amount0Desired: 1000000,
      amount1Desired: 1000000,
      amount0Min: 0,
      amount1Min: 0,
      deadline: 1,
    }

    return nft.mint(liquidityParams)
  };

  getMinTick = (tickSpacing) => Math.ceil(-887272 / tickSpacing) * tickSpacing
  getMaxTick = (tickSpacing) => Math.floor(887272 / tickSpacing) * tickSpacing

  const bn = require('bignumber.js')
  bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })
  function encodePriceSqrt(reserve1, reserve0) {
    return BigNumber.from(
      new bn(reserve1.toString())
        .div(reserve0.toString())
        .sqrt()
        .multipliedBy(new bn(2).pow(96))
        .integerValue(3)
        .toString()
    )
  };
});
