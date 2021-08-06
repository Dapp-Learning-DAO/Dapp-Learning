import { ethers } from 'hardhat'
import { LiquidityAmountsTest } from '../typechain/LiquidityAmountsTest'
import { encodePriceSqrt } from './shared/encodePriceSqrt'
import { expect } from './shared/expect'

import snapshotGasCost from './shared/snapshotGasCost'

describe('LiquidityAmounts', async () => {
  let liquidityFromAmounts: LiquidityAmountsTest

  before('deploy test library', async () => {
    const liquidityFromAmountsTestFactory = await ethers.getContractFactory('LiquidityAmountsTest')
    liquidityFromAmounts = (await liquidityFromAmountsTestFactory.deploy()) as LiquidityAmountsTest
  })

  describe('#getLiquidityForAmount0', () => {
    it('gas', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(liquidityFromAmounts.getGasCostOfGetLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, 100))
    })
  })

  describe('#getLiquidityForAmount1', () => {
    it('gas', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(liquidityFromAmounts.getGasCostOfGetLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, 100))
    })
  })

  describe('#getLiquidityForAmounts', () => {
    it('amounts for price inside', async () => {
      const sqrtPriceX96 = encodePriceSqrt(1, 1)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const liquidity = await liquidityFromAmounts.getLiquidityForAmounts(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        100,
        200
      )
      expect(liquidity).to.eq(2148)
    })

    it('amounts for price below', async () => {
      const sqrtPriceX96 = encodePriceSqrt(99, 110)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const liquidity = await liquidityFromAmounts.getLiquidityForAmounts(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        100,
        200
      )
      expect(liquidity).to.eq(1048)
    })

    it('amounts for price above', async () => {
      const sqrtPriceX96 = encodePriceSqrt(111, 100)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const liquidity = await liquidityFromAmounts.getLiquidityForAmounts(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        100,
        200
      )
      expect(liquidity).to.eq(2097)
    })

    it('amounts for price equal to lower boundary', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceX96 = sqrtPriceAX96
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const liquidity = await liquidityFromAmounts.getLiquidityForAmounts(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        100,
        200
      )
      expect(liquidity).to.eq(1048)
    })

    it('amounts for price equal to upper boundary', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const sqrtPriceX96 = sqrtPriceBX96
      const liquidity = await liquidityFromAmounts.getLiquidityForAmounts(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        100,
        200
      )
      expect(liquidity).to.eq(2097)
    })

    it('gas for price below', async () => {
      const sqrtPriceX96 = encodePriceSqrt(99, 110)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(
        liquidityFromAmounts.getGasCostOfGetLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, 100, 200)
      )
    })
    it('gas for price above', async () => {
      const sqrtPriceX96 = encodePriceSqrt(111, 100)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(
        liquidityFromAmounts.getGasCostOfGetLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, 100, 200)
      )
    })
    it('gas for price inside', async () => {
      const sqrtPriceX96 = encodePriceSqrt(1, 1)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(
        liquidityFromAmounts.getGasCostOfGetLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, 100, 200)
      )
    })
  })

  describe('#getAmount0ForLiquidity', () => {
    it('gas', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(liquidityFromAmounts.getGasCostOfGetAmount0ForLiquidity(sqrtPriceAX96, sqrtPriceBX96, 100))
    })
  })

  describe('#getLiquidityForAmount1', () => {
    it('gas', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(liquidityFromAmounts.getGasCostOfGetAmount1ForLiquidity(sqrtPriceAX96, sqrtPriceBX96, 100))
    })
  })

  describe('#getAmountsForLiquidity', () => {
    it('amounts for price inside', async () => {
      const sqrtPriceX96 = encodePriceSqrt(1, 1)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const { amount0, amount1 } = await liquidityFromAmounts.getAmountsForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        2148
      )
      expect(amount0).to.eq(99)
      expect(amount1).to.eq(99)
    })

    it('amounts for price below', async () => {
      const sqrtPriceX96 = encodePriceSqrt(99, 110)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const { amount0, amount1 } = await liquidityFromAmounts.getAmountsForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        1048
      )
      expect(amount0).to.eq(99)
      expect(amount1).to.eq(0)
    })

    it('amounts for price above', async () => {
      const sqrtPriceX96 = encodePriceSqrt(111, 100)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const { amount0, amount1 } = await liquidityFromAmounts.getAmountsForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        2097
      )
      expect(amount0).to.eq(0)
      expect(amount1).to.eq(199)
    })

    it('amounts for price on lower boundary', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceX96 = sqrtPriceAX96
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const { amount0, amount1 } = await liquidityFromAmounts.getAmountsForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        1048
      )
      expect(amount0).to.eq(99)
      expect(amount1).to.eq(0)
    })

    it('amounts for price on upper boundary', async () => {
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      const sqrtPriceX96 = sqrtPriceBX96
      const { amount0, amount1 } = await liquidityFromAmounts.getAmountsForLiquidity(
        sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        2097
      )
      expect(amount0).to.eq(0)
      expect(amount1).to.eq(199)
    })

    it('gas for price below', async () => {
      const sqrtPriceX96 = encodePriceSqrt(99, 110)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(
        liquidityFromAmounts.getGasCostOfGetAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, 2148)
      )
    })
    it('gas for price above', async () => {
      const sqrtPriceX96 = encodePriceSqrt(111, 100)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(
        liquidityFromAmounts.getGasCostOfGetAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, 1048)
      )
    })
    it('gas for price inside', async () => {
      const sqrtPriceX96 = encodePriceSqrt(1, 1)
      const sqrtPriceAX96 = encodePriceSqrt(100, 110)
      const sqrtPriceBX96 = encodePriceSqrt(110, 100)
      await snapshotGasCost(
        liquidityFromAmounts.getGasCostOfGetAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, 2097)
      )
    })
  })
})
