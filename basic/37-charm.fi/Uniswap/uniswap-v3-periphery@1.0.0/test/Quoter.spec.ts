import { Fixture } from 'ethereum-waffle'
import { constants } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { MockTimeNonfungiblePositionManager, Quoter, TestERC20 } from '../typechain'
import completeFixture from './shared/completeFixture'
import { FeeAmount, MaxUint128, TICK_SPACINGS } from './shared/constants'
import { encodePriceSqrt } from './shared/encodePriceSqrt'
import { expandTo18Decimals } from './shared/expandTo18Decimals'
import { expect } from './shared/expect'
import { encodePath } from './shared/path'
import { getMaxTick, getMinTick } from './shared/ticks'

describe('Quoter', () => {
  const wallets = waffle.provider.getWallets()
  const [wallet, trader] = wallets

  const swapRouterFixture: Fixture<{
    nft: MockTimeNonfungiblePositionManager
    tokens: [TestERC20, TestERC20, TestERC20]
    quoter: Quoter
  }> = async (wallets, provider) => {
    const { weth9, factory, router, tokens, nft } = await completeFixture(wallets, provider)

    // approve & fund wallets
    for (const token of tokens) {
      await Promise.all([
        token.approve(router.address, constants.MaxUint256),
        token.approve(nft.address, constants.MaxUint256),
        token.connect(trader).approve(router.address, constants.MaxUint256),
        token.transfer(trader.address, expandTo18Decimals(1_000_000)),
      ])
    }

    const quoterFactory = await ethers.getContractFactory('Quoter')
    quoter = (await quoterFactory.deploy(factory.address, weth9.address)) as Quoter

    return {
      tokens,
      nft,
      quoter,
    }
  }

  let nft: MockTimeNonfungiblePositionManager
  let tokens: [TestERC20, TestERC20, TestERC20]
  let quoter: Quoter

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  // helper for getting weth and token balances
  beforeEach('load fixture', async () => {
    ;({ tokens, nft, quoter } = await loadFixture(swapRouterFixture))
  })

  describe('quotes', () => {
    async function createPool(tokenAddressA: string, tokenAddressB: string) {
      if (tokenAddressA.toLowerCase() > tokenAddressB.toLowerCase())
        [tokenAddressA, tokenAddressB] = [tokenAddressB, tokenAddressA]

      await nft.createAndInitializePoolIfNecessary(
        tokenAddressA,
        tokenAddressB,
        FeeAmount.MEDIUM,
        encodePriceSqrt(1, 1)
      )

      const liquidityParams = {
        token0: tokenAddressA,
        token1: tokenAddressB,
        fee: FeeAmount.MEDIUM,
        tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
        tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
        recipient: wallet.address,
        amount0Desired: 1000000,
        amount1Desired: 1000000,
        amount0Min: 0,
        amount1Min: 0,
        deadline: 1,
      }

      return nft.mint(liquidityParams)
    }

    beforeEach(async () => {
      await createPool(tokens[0].address, tokens[1].address)
      await createPool(tokens[1].address, tokens[2].address)
    })

    describe('#quoteExactInput', () => {
      it('0 -> 1', async () => {
        const quote = await quoter.callStatic.quoteExactInput(
          encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
          3
        )

        expect(quote).to.eq(1)
      })

      it('1 -> 0', async () => {
        const quote = await quoter.callStatic.quoteExactInput(
          encodePath([tokens[1].address, tokens[0].address], [FeeAmount.MEDIUM]),
          3
        )

        expect(quote).to.eq(1)
      })

      it('0 -> 1 -> 2', async () => {
        const quote = await quoter.callStatic.quoteExactInput(
          encodePath(
            tokens.map((token) => token.address),
            [FeeAmount.MEDIUM, FeeAmount.MEDIUM]
          ),
          5
        )

        expect(quote).to.eq(1)
      })

      it('2 -> 1 -> 0', async () => {
        const quote = await quoter.callStatic.quoteExactInput(
          encodePath(tokens.map((token) => token.address).reverse(), [FeeAmount.MEDIUM, FeeAmount.MEDIUM]),
          5
        )

        expect(quote).to.eq(1)
      })
    })

    describe('#quoteExactInputSingle', () => {
      it('0 -> 1', async () => {
        const quote = await quoter.callStatic.quoteExactInputSingle(
          tokens[0].address,
          tokens[1].address,
          FeeAmount.MEDIUM,
          MaxUint128,
          // -2%
          encodePriceSqrt(100, 102)
        )

        expect(quote).to.eq(9852)
      })

      it('1 -> 0', async () => {
        const quote = await quoter.callStatic.quoteExactInputSingle(
          tokens[1].address,
          tokens[0].address,
          FeeAmount.MEDIUM,
          MaxUint128,
          // +2%
          encodePriceSqrt(102, 100)
        )

        expect(quote).to.eq(9852)
      })
    })

    describe('#quoteExactOutput', () => {
      it('0 -> 1', async () => {
        const quote = await quoter.callStatic.quoteExactOutput(
          encodePath([tokens[1].address, tokens[0].address], [FeeAmount.MEDIUM]),
          1
        )

        expect(quote).to.eq(3)
      })

      it('1 -> 0', async () => {
        const quote = await quoter.callStatic.quoteExactOutput(
          encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
          1
        )

        expect(quote).to.eq(3)
      })

      it('0 -> 1 -> 2', async () => {
        const quote = await quoter.callStatic.quoteExactOutput(
          encodePath(tokens.map((token) => token.address).reverse(), [FeeAmount.MEDIUM, FeeAmount.MEDIUM]),
          1
        )

        expect(quote).to.eq(5)
      })

      it('2 -> 1 -> 0', async () => {
        const quote = await quoter.callStatic.quoteExactOutput(
          encodePath(
            tokens.map((token) => token.address),
            [FeeAmount.MEDIUM, FeeAmount.MEDIUM]
          ),
          1
        )

        expect(quote).to.eq(5)
      })
    })

    describe('#quoteExactOutputSingle', () => {
      it('0 -> 1', async () => {
        const quote = await quoter.callStatic.quoteExactOutputSingle(
          tokens[0].address,
          tokens[1].address,
          FeeAmount.MEDIUM,
          MaxUint128,
          encodePriceSqrt(100, 102)
        )

        expect(quote).to.eq(9981)
      })

      it('1 -> 0', async () => {
        const quote = await quoter.callStatic.quoteExactOutputSingle(
          tokens[1].address,
          tokens[0].address,
          FeeAmount.MEDIUM,
          MaxUint128,
          encodePriceSqrt(102, 100)
        )

        expect(quote).to.eq(9981)
      })
    })
  })
})
