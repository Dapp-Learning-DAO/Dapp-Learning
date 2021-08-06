import { BigNumber, constants } from 'ethers'
import { encodePriceSqrt } from './shared/encodePriceSqrt'
import { waffle, ethers } from 'hardhat'
import { expect } from './shared/expect'
import { TestERC20Metadata, NFTDescriptorTest } from '../typechain'
import { Fixture } from 'ethereum-waffle'
import { FeeAmount, TICK_SPACINGS } from './shared/constants'
import snapshotGasCost from './shared/snapshotGasCost'
import { formatSqrtRatioX96 } from './shared/formatSqrtRatioX96'
import { getMaxTick, getMinTick } from './shared/ticks'
import { randomBytes } from 'crypto'
import fs from 'fs'
import isSvg from 'is-svg'

const TEN = BigNumber.from(10)
const LOWEST_SQRT_RATIO = 4310618292
const HIGHEST_SQRT_RATIO = BigNumber.from(33849).mul(TEN.pow(34))

describe('NFTDescriptor', () => {
  const wallets = waffle.provider.getWallets()

  const nftDescriptorFixture: Fixture<{
    tokens: [TestERC20Metadata, TestERC20Metadata, TestERC20Metadata, TestERC20Metadata]
    nftDescriptor: NFTDescriptorTest
  }> = async (wallets, provider) => {
    const nftDescriptorLibraryFactory = await ethers.getContractFactory('NFTDescriptor')
    const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy()

    const tokenFactory = await ethers.getContractFactory('TestERC20Metadata')
    const NFTDescriptorFactory = await ethers.getContractFactory('NFTDescriptorTest', {
      libraries: {
        NFTDescriptor: nftDescriptorLibrary.address,
      },
    })
    const nftDescriptor = (await NFTDescriptorFactory.deploy()) as NFTDescriptorTest
    const tokens = (await Promise.all([
      tokenFactory.deploy(constants.MaxUint256.div(2), 'Test ERC20', 'TEST1'), // do not use maxu256 to avoid overflowing
      tokenFactory.deploy(constants.MaxUint256.div(2), 'Test ERC20', 'TEST2'),
      tokenFactory.deploy(constants.MaxUint256.div(2), 'Test ERC20', 'TEST3'),
      tokenFactory.deploy(constants.MaxUint256.div(2), 'Test ERC20', 'TEST4'),
    ])) as [TestERC20Metadata, TestERC20Metadata, TestERC20Metadata, TestERC20Metadata]
    tokens.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1))
    return {
      nftDescriptor,
      tokens,
    }
  }

  let nftDescriptor: NFTDescriptorTest
  let tokens: [TestERC20Metadata, TestERC20Metadata, TestERC20Metadata, TestERC20Metadata]

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ nftDescriptor, tokens } = await loadFixture(nftDescriptorFixture))
  })

  describe('#constructTokenURI', () => {
    let tokenId: number
    let baseTokenAddress: string
    let quoteTokenAddress: string
    let baseTokenSymbol: string
    let quoteTokenSymbol: string
    let baseTokenDecimals: number
    let quoteTokenDecimals: number
    let flipRatio: boolean
    let tickLower: number
    let tickUpper: number
    let tickCurrent: number
    let tickSpacing: number
    let fee: number
    let poolAddress: string

    beforeEach(async () => {
      tokenId = 123
      baseTokenAddress = tokens[0].address
      quoteTokenAddress = tokens[1].address
      baseTokenSymbol = await tokens[0].symbol()
      quoteTokenSymbol = await tokens[1].symbol()
      baseTokenDecimals = await tokens[0].decimals()
      quoteTokenDecimals = await tokens[1].decimals()
      flipRatio = false
      tickLower = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])
      tickUpper = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM])
      tickCurrent = 0
      tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM]
      fee = 3000
      poolAddress = `0x${'b'.repeat(40)}`
    })

    function extractURIJson(uri: string): { name: string; description: string; image: string } {
      const encodedJSON = uri.substr('data:application/json;base64,'.length)
      const decodedJSON = Buffer.from(encodedJSON, 'base64').toString('utf8')
      return JSON.parse(decodedJSON)
    }

    it('returns the valid JSON string with min and max ticks', async () => {
      const json = extractURIJson(
        await nftDescriptor.constructTokenURI({
          tokenId,
          baseTokenAddress,
          quoteTokenAddress,
          baseTokenSymbol,
          quoteTokenSymbol,
          baseTokenDecimals,
          quoteTokenDecimals,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          tickSpacing,
          fee,
          poolAddress,
        })
      )

      const tokenUri = constructTokenMetadata(
        tokenId,
        quoteTokenAddress,
        baseTokenAddress,
        poolAddress,
        quoteTokenSymbol,
        baseTokenSymbol,
        flipRatio,
        tickLower,
        tickUpper,
        tickCurrent,
        '0.3%',
        'MIN<>MAX'
      )

      expect(json.description).to.equal(tokenUri.description)
      expect(json.name).to.equal(tokenUri.name)
    })

    it('returns the valid JSON string with mid ticks', async () => {
      tickLower = -10
      tickUpper = 10
      tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM]
      fee = 3000

      const json = extractURIJson(
        await nftDescriptor.constructTokenURI({
          tokenId,
          baseTokenAddress,
          quoteTokenAddress,
          baseTokenSymbol,
          quoteTokenSymbol,
          baseTokenDecimals,
          quoteTokenDecimals,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          tickSpacing,
          fee,
          poolAddress,
        })
      )

      const tokenMetadata = constructTokenMetadata(
        tokenId,
        quoteTokenAddress,
        baseTokenAddress,
        poolAddress,
        quoteTokenSymbol,
        baseTokenSymbol,
        flipRatio,
        tickLower,
        tickUpper,
        tickCurrent,
        '0.3%',
        '0.99900<>1.0010'
      )

      expect(json.description).to.equal(tokenMetadata.description)
      expect(json.name).to.equal(tokenMetadata.name)
    })

    it('returns valid JSON when token symbols contain quotes', async () => {
      quoteTokenSymbol = '"TES"T1"'
      const json = extractURIJson(
        await nftDescriptor.constructTokenURI({
          tokenId,
          baseTokenAddress,
          quoteTokenAddress,
          baseTokenSymbol,
          quoteTokenSymbol,
          baseTokenDecimals,
          quoteTokenDecimals,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          tickSpacing,
          fee,
          poolAddress,
        })
      )

      const tokenMetadata = constructTokenMetadata(
        tokenId,
        quoteTokenAddress,
        baseTokenAddress,
        poolAddress,
        quoteTokenSymbol,
        baseTokenSymbol,
        flipRatio,
        tickLower,
        tickUpper,
        tickCurrent,
        '0.3%',
        'MIN<>MAX'
      )

      expect(json.description).to.equal(tokenMetadata.description)
      expect(json.name).to.equal(tokenMetadata.name)
    })

    describe('when the token ratio is flipped', () => {
      it('returns the valid JSON for mid ticks', async () => {
        flipRatio = true
        tickLower = -10
        tickUpper = 10

        const json = extractURIJson(
          await nftDescriptor.constructTokenURI({
            tokenId,
            baseTokenAddress,
            quoteTokenAddress,
            baseTokenSymbol,
            quoteTokenSymbol,
            baseTokenDecimals,
            quoteTokenDecimals,
            flipRatio,
            tickLower,
            tickUpper,
            tickCurrent,
            tickSpacing,
            fee,
            poolAddress,
          })
        )

        const tokenMetadata = constructTokenMetadata(
          tokenId,
          quoteTokenAddress,
          baseTokenAddress,
          poolAddress,
          quoteTokenSymbol,
          baseTokenSymbol,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          '0.3%',
          '0.99900<>1.0010'
        )

        expect(json.description).to.equal(tokenMetadata.description)
        expect(json.name).to.equal(tokenMetadata.name)
      })

      it('returns the valid JSON for min/max ticks', async () => {
        flipRatio = true

        const json = extractURIJson(
          await nftDescriptor.constructTokenURI({
            tokenId,
            baseTokenAddress,
            quoteTokenAddress,
            baseTokenSymbol,
            quoteTokenSymbol,
            baseTokenDecimals,
            quoteTokenDecimals,
            flipRatio,
            tickLower,
            tickUpper,
            tickCurrent,
            tickSpacing,
            fee,
            poolAddress,
          })
        )

        const tokenMetadata = constructTokenMetadata(
          tokenId,
          quoteTokenAddress,
          baseTokenAddress,
          poolAddress,
          quoteTokenSymbol,
          baseTokenSymbol,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          '0.3%',
          'MIN<>MAX'
        )

        expect(json.description).to.equal(tokenMetadata.description)
        expect(json.name).to.equal(tokenMetadata.name)
      })
    })

    it('gas', async () => {
      await snapshotGasCost(
        nftDescriptor.getGasCostOfConstructTokenURI({
          tokenId,
          baseTokenAddress,
          quoteTokenAddress,
          baseTokenSymbol,
          quoteTokenSymbol,
          baseTokenDecimals,
          quoteTokenDecimals,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          tickSpacing,
          fee,
          poolAddress,
        })
      )
    })

    it('snapshot matches', async () => {
      // get snapshot with super rare special sparkle
      tokenId = 1
      poolAddress = `0x${'b'.repeat(40)}`
      // get a snapshot with svg fade
      tickCurrent = -1
      tickLower = 0
      tickUpper = 1000
      tickSpacing = TICK_SPACINGS[FeeAmount.LOW]
      fee = FeeAmount.LOW
      quoteTokenAddress = '0xabcdeabcdefabcdefabcdefabcdefabcdefabcdf'
      baseTokenAddress = '0x1234567890123456789123456789012345678901'
      quoteTokenSymbol = 'UNI'
      baseTokenSymbol = 'WETH'
      expect(
        await nftDescriptor.constructTokenURI({
          tokenId,
          quoteTokenAddress,
          baseTokenAddress,
          quoteTokenSymbol,
          baseTokenSymbol,
          baseTokenDecimals,
          quoteTokenDecimals,
          flipRatio,
          tickLower,
          tickUpper,
          tickCurrent,
          tickSpacing,
          fee,
          poolAddress,
        })
      ).toMatchSnapshot()
    })
  })

  describe('#addressToString', () => {
    it('returns the correct string for a given address', async () => {
      let addressStr = await nftDescriptor.addressToString(`0x${'1234abcdef'.repeat(4)}`)
      expect(addressStr).to.eq('0x1234abcdef1234abcdef1234abcdef1234abcdef')
      addressStr = await nftDescriptor.addressToString(`0x${'1'.repeat(40)}`)
      expect(addressStr).to.eq(`0x${'1'.repeat(40)}`)
    })
  })

  describe('#tickToDecimalString', () => {
    let tickSpacing: number
    let minTick: number
    let maxTick: number

    describe('when tickspacing is 10', () => {
      before(() => {
        tickSpacing = TICK_SPACINGS[FeeAmount.LOW]
        minTick = getMinTick(tickSpacing)
        maxTick = getMaxTick(tickSpacing)
      })

      it('returns MIN on lowest tick', async () => {
        expect(await nftDescriptor.tickToDecimalString(minTick, tickSpacing, 18, 18, false)).to.equal('MIN')
      })

      it('returns MAX on the highest tick', async () => {
        expect(await nftDescriptor.tickToDecimalString(maxTick, tickSpacing, 18, 18, false)).to.equal('MAX')
      })

      it('returns the correct decimal string when the tick is in range', async () => {
        expect(await nftDescriptor.tickToDecimalString(1, tickSpacing, 18, 18, false)).to.equal('1.0001')
      })

      it('returns the correct decimal string when tick is mintick for different tickspace', async () => {
        const otherMinTick = getMinTick(TICK_SPACINGS[FeeAmount.HIGH])
        expect(await nftDescriptor.tickToDecimalString(otherMinTick, tickSpacing, 18, 18, false)).to.equal(
          '0.0000000000000000000000000000000000000029387'
        )
      })
    })

    describe('when tickspacing is 60', () => {
      before(() => {
        tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM]
        minTick = getMinTick(tickSpacing)
        maxTick = getMaxTick(tickSpacing)
      })

      it('returns MIN on lowest tick', async () => {
        expect(await nftDescriptor.tickToDecimalString(minTick, tickSpacing, 18, 18, false)).to.equal('MIN')
      })

      it('returns MAX on the highest tick', async () => {
        expect(await nftDescriptor.tickToDecimalString(maxTick, tickSpacing, 18, 18, false)).to.equal('MAX')
      })

      it('returns the correct decimal string when the tick is in range', async () => {
        expect(await nftDescriptor.tickToDecimalString(-1, tickSpacing, 18, 18, false)).to.equal('0.99990')
      })

      it('returns the correct decimal string when tick is mintick for different tickspace', async () => {
        const otherMinTick = getMinTick(TICK_SPACINGS[FeeAmount.HIGH])
        expect(await nftDescriptor.tickToDecimalString(otherMinTick, tickSpacing, 18, 18, false)).to.equal(
          '0.0000000000000000000000000000000000000029387'
        )
      })
    })

    describe('when tickspacing is 200', () => {
      before(() => {
        tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        minTick = getMinTick(tickSpacing)
        maxTick = getMaxTick(tickSpacing)
      })

      it('returns MIN on lowest tick', async () => {
        expect(await nftDescriptor.tickToDecimalString(minTick, tickSpacing, 18, 18, false)).to.equal('MIN')
      })

      it('returns MAX on the highest tick', async () => {
        expect(await nftDescriptor.tickToDecimalString(maxTick, tickSpacing, 18, 18, false)).to.equal('MAX')
      })

      it('returns the correct decimal string when the tick is in range', async () => {
        expect(await nftDescriptor.tickToDecimalString(0, tickSpacing, 18, 18, false)).to.equal('1.0000')
      })

      it('returns the correct decimal string when tick is mintick for different tickspace', async () => {
        const otherMinTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])
        expect(await nftDescriptor.tickToDecimalString(otherMinTick, tickSpacing, 18, 18, false)).to.equal(
          '0.0000000000000000000000000000000000000029387'
        )
      })
    })

    describe('when token ratio is flipped', () => {
      it('returns the inverse of default ratio for medium sized numbers', async () => {
        const tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        expect(await nftDescriptor.tickToDecimalString(10, tickSpacing, 18, 18, false)).to.eq('1.0010')
        expect(await nftDescriptor.tickToDecimalString(10, tickSpacing, 18, 18, true)).to.eq('0.99900')
      })

      it('returns the inverse of default ratio for large numbers', async () => {
        const tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        expect(await nftDescriptor.tickToDecimalString(487272, tickSpacing, 18, 18, false)).to.eq(
          '1448400000000000000000'
        )
        expect(await nftDescriptor.tickToDecimalString(487272, tickSpacing, 18, 18, true)).to.eq(
          '0.00000000000000000000069041'
        )
      })

      it('returns the inverse of default ratio for small numbers', async () => {
        const tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        expect(await nftDescriptor.tickToDecimalString(-387272, tickSpacing, 18, 18, false)).to.eq(
          '0.000000000000000015200'
        )
        expect(await nftDescriptor.tickToDecimalString(-387272, tickSpacing, 18, 18, true)).to.eq('65791000000000000')
      })

      it('returns the correct string with differing token decimals', async () => {
        const tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        expect(await nftDescriptor.tickToDecimalString(1000, tickSpacing, 18, 18, true)).to.eq('0.90484')
        expect(await nftDescriptor.tickToDecimalString(1000, tickSpacing, 18, 10, true)).to.eq('90484000')
        expect(await nftDescriptor.tickToDecimalString(1000, tickSpacing, 10, 18, true)).to.eq('0.0000000090484')
      })

      it('returns MIN for highest tick', async () => {
        const tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        const lowestTick = getMinTick(TICK_SPACINGS[FeeAmount.HIGH])
        expect(await nftDescriptor.tickToDecimalString(lowestTick, tickSpacing, 18, 18, true)).to.eq('MAX')
      })

      it('returns MAX for lowest tick', async () => {
        const tickSpacing = TICK_SPACINGS[FeeAmount.HIGH]
        const highestTick = getMaxTick(TICK_SPACINGS[FeeAmount.HIGH])
        expect(await nftDescriptor.tickToDecimalString(highestTick, tickSpacing, 18, 18, true)).to.eq('MIN')
      })
    })
  })

  describe('#fixedPointToDecimalString', () => {
    describe('returns the correct string for', () => {
      it('the highest possible price', async () => {
        const ratio = encodePriceSqrt(33849, 1 / 10 ** 34)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq(
          '338490000000000000000000000000000000000'
        )
      })

      it('large numbers', async () => {
        let ratio = encodePriceSqrt(25811, 1 / 10 ** 11)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('2581100000000000')
        ratio = encodePriceSqrt(17662, 1 / 10 ** 5)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('1766200000')
      })

      it('exactly 5 sigfig whole number', async () => {
        const ratio = encodePriceSqrt(42026, 1)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('42026')
      })

      it('when the decimal is at index 4', async () => {
        const ratio = encodePriceSqrt(12087, 10)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('1208.7')
      })

      it('when the decimal is at index 3', async () => {
        const ratio = encodePriceSqrt(12087, 100)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('120.87')
      })

      it('when the decimal is at index 2', async () => {
        const ratio = encodePriceSqrt(12087, 1000)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('12.087')
      })

      it('when the decimal is at index 1', async () => {
        const ratio = encodePriceSqrt(12345, 10000)
        const bla = await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('1.2345')
      })

      it('when sigfigs have trailing 0s after the decimal', async () => {
        const ratio = encodePriceSqrt(1, 1)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('1.0000')
      })

      it('when there are exactly 5 numbers after the decimal', async () => {
        const ratio = encodePriceSqrt(12345, 100000)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('0.12345')
      })

      it('very small numbers', async () => {
        let ratio = encodePriceSqrt(38741, 10 ** 20)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq('0.00000000000000038741')
        ratio = encodePriceSqrt(88498, 10 ** 35)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq(
          '0.00000000000000000000000000000088498'
        )
      })

      it('smallest number', async () => {
        const ratio = encodePriceSqrt(39000, 10 ** 43)
        expect(await nftDescriptor.fixedPointToDecimalString(ratio, 18, 18)).to.eq(
          '0.0000000000000000000000000000000000000029387'
        )
      })
    })

    describe('when tokens have different decimal precision', () => {
      describe('when baseToken has more precision decimals than quoteToken', () => {
        it('returns the correct string when the decimal difference is even', async () => {
          expect(await nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1), 18, 16)).to.eq('100.00')
        })

        it('returns the correct string when the decimal difference is odd', async () => {
          const tenRatio = encodePriceSqrt(10, 1)
          expect(await nftDescriptor.fixedPointToDecimalString(tenRatio, 18, 17)).to.eq('100.00')
        })

        it('does not account for higher token0 precision if difference is more than 18', async () => {
          expect(await nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1), 24, 5)).to.eq('1.0000')
        })
      })

      describe('when quoteToken has more precision decimals than baseToken', () => {
        it('returns the correct string when the decimal difference is even', async () => {
          expect(await nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1), 10, 18)).to.eq('0.000000010000')
        })

        it('returns the correct string when the decimal difference is odd', async () => {
          expect(await nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1), 7, 18)).to.eq('0.000000000010000')
        })

        // TODO: provide compatibility token prices that breach minimum price due to token decimal differences
        it.skip('returns the correct string when the decimal difference brings ratio below the minimum', async () => {
          const lowRatio = encodePriceSqrt(88498, 10 ** 35)
          expect(await nftDescriptor.fixedPointToDecimalString(lowRatio, 10, 20)).to.eq(
            '0.000000000000000000000000000000000000000088498'
          )
        })

        it('does not account for higher token1 precision if difference is more than 18', async () => {
          expect(await nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1), 24, 5)).to.eq('1.0000')
        })
      })

      it('some fuzz', async () => {
        const random = (min: number, max: number): number => {
          return Math.floor(min + ((Math.random() * 100) % (max + 1 - min)))
        }

        const inputs: [BigNumber, number, number][] = []
        let i = 0
        while (i <= 20) {
          const ratio = BigNumber.from(`0x${randomBytes(random(7, 20)).toString('hex')}`)
          const decimals0 = random(3, 21)
          const decimals1 = random(3, 21)
          const decimalDiff = Math.abs(decimals0 - decimals1)

          // TODO: Address edgecase out of bounds prices due to decimal differences
          if (
            ratio.div(TEN.pow(decimalDiff)).gt(LOWEST_SQRT_RATIO) &&
            ratio.mul(TEN.pow(decimalDiff)).lt(HIGHEST_SQRT_RATIO)
          ) {
            inputs.push([ratio, decimals0, decimals1])
            i++
          }
        }

        for (let i in inputs) {
          let ratio: BigNumber | number
          let decimals0: number
          let decimals1: number
          ;[ratio, decimals0, decimals1] = inputs[i]
          let result = await nftDescriptor.fixedPointToDecimalString(ratio, decimals0, decimals1)
          expect(formatSqrtRatioX96(ratio, decimals0, decimals1)).to.eq(result)
        }
      }).timeout(300_000)
    })
  })

  describe('#feeToPercentString', () => {
    it('returns the correct fee for 0', async () => {
      expect(await nftDescriptor.feeToPercentString(0)).to.eq('0%')
    })

    it('returns the correct fee for 1', async () => {
      expect(await nftDescriptor.feeToPercentString(1)).to.eq('0.0001%')
    })

    it('returns the correct fee for 30', async () => {
      expect(await nftDescriptor.feeToPercentString(30)).to.eq('0.003%')
    })

    it('returns the correct fee for 33', async () => {
      expect(await nftDescriptor.feeToPercentString(33)).to.eq('0.0033%')
    })

    it('returns the correct fee for 500', async () => {
      expect(await nftDescriptor.feeToPercentString(500)).to.eq('0.05%')
    })

    it('returns the correct fee for 2500', async () => {
      expect(await nftDescriptor.feeToPercentString(2500)).to.eq('0.25%')
    })

    it('returns the correct fee for 3000', async () => {
      expect(await nftDescriptor.feeToPercentString(3000)).to.eq('0.3%')
    })

    it('returns the correct fee for 10000', async () => {
      expect(await nftDescriptor.feeToPercentString(10000)).to.eq('1%')
    })

    it('returns the correct fee for 17000', async () => {
      expect(await nftDescriptor.feeToPercentString(17000)).to.eq('1.7%')
    })

    it('returns the correct fee for 100000', async () => {
      expect(await nftDescriptor.feeToPercentString(100000)).to.eq('10%')
    })

    it('returns the correct fee for 150000', async () => {
      expect(await nftDescriptor.feeToPercentString(150000)).to.eq('15%')
    })

    it('returns the correct fee for 102000', async () => {
      expect(await nftDescriptor.feeToPercentString(102000)).to.eq('10.2%')
    })

    it('returns the correct fee for 10000000', async () => {
      expect(await nftDescriptor.feeToPercentString(1000000)).to.eq('100%')
    })

    it('returns the correct fee for 1005000', async () => {
      expect(await nftDescriptor.feeToPercentString(1005000)).to.eq('100.5%')
    })

    it('returns the correct fee for 10000000', async () => {
      expect(await nftDescriptor.feeToPercentString(10000000)).to.eq('1000%')
    })

    it('returns the correct fee for 12300000', async () => {
      expect(await nftDescriptor.feeToPercentString(12300000)).to.eq('1230%')
    })
  })

  describe('#tokenToColorHex', () => {
    function tokenToColorHex(tokenAddress: string, startIndex: number): string {
      return `${tokenAddress.slice(startIndex, startIndex + 6).toLowerCase()}`
    }

    it('returns the correct hash for the first 3 bytes of the token address', async () => {
      expect(await nftDescriptor.tokenToColorHex(tokens[0].address, 136)).to.eq(tokenToColorHex(tokens[0].address, 2))
      expect(await nftDescriptor.tokenToColorHex(tokens[1].address, 136)).to.eq(tokenToColorHex(tokens[1].address, 2))
    })

    it('returns the correct hash for the last 3 bytes of the address', async () => {
      expect(await nftDescriptor.tokenToColorHex(tokens[0].address, 0)).to.eq(tokenToColorHex(tokens[0].address, 36))
      expect(await nftDescriptor.tokenToColorHex(tokens[1].address, 0)).to.eq(tokenToColorHex(tokens[1].address, 36))
    })
  })

  describe('#rangeLocation', () => {
    it('returns the correct coordinates when range midpoint under -100_000', async () => {
      const coords = await nftDescriptor.rangeLocation(-887_272, -887_100)
      expect(coords[0]).to.eq('8')
      expect(coords[1]).to.eq('7')
    })

    it('returns the correct coordinates when range midpoint is between -100_000 and -50_000', async () => {
      const coords = await nftDescriptor.rangeLocation(-100_000, -90_000)
      expect(coords[0]).to.eq('8')
      expect(coords[1]).to.eq('10.5')
    })

    it('returns the correct coordinates when range midpoint is between -50_000 and -10_000', async () => {
      const coords = await nftDescriptor.rangeLocation(-50_000, -20_000)
      expect(coords[0]).to.eq('8')
      expect(coords[1]).to.eq('14.25')
    })

    it('returns the correct coordinates when range midpoint is between -10_000 and -100', async () => {
      const coords = await nftDescriptor.rangeLocation(-10_000, -5_000)
      expect(coords[0]).to.eq('10')
      expect(coords[1]).to.eq('18')
    })

    it('returns the correct coordinates when range midpoint is between -100 and 0', async () => {
      const coords = await nftDescriptor.rangeLocation(-5, -1)
      expect(coords[0]).to.eq('11')
      expect(coords[1]).to.eq('21')
    })

    it('returns the correct coordinates when range midpoint is between 0 and 100', async () => {
      const coords = await nftDescriptor.rangeLocation(1, 100)
      expect(coords[0]).to.eq('13')
      expect(coords[1]).to.eq('23')
    })

    it('returns the correct coordinates when range midpoint is between 100 and 10_000', async () => {
      const coords = await nftDescriptor.rangeLocation(500, 100)
      expect(coords[0]).to.eq('15')
      expect(coords[1]).to.eq('25')
    })

    it('returns the correct coordinates when range midpoint is between 10_000 and 50_000', async () => {
      const coords = await nftDescriptor.rangeLocation(10_000, 30_000)
      expect(coords[0]).to.eq('18')
      expect(coords[1]).to.eq('26')
    })

    it('returns the correct coordinates when range midpoint is between 50_000 and 100_000', async () => {
      const coords = await nftDescriptor.rangeLocation(100_000, 99_500)
      expect(coords[0]).to.eq('21')
      expect(coords[1]).to.eq('27')
    })

    it('returns the correct coordinates when range midpoint is above 100_000', async () => {
      const coords = await nftDescriptor.rangeLocation(200_000, 100_000)
      expect(coords[0]).to.eq('24')
      expect(coords[1]).to.eq('27')
    })

    it('math does not overflow on max value', async () => {
      const coords = await nftDescriptor.rangeLocation(887_272, 887_272)
      expect(coords[0]).to.eq('24')
      expect(coords[1]).to.eq('27')
    })
  })

  describe('#svgImage', () => {
    let tokenId: number
    let baseTokenAddress: string
    let quoteTokenAddress: string
    let baseTokenSymbol: string
    let quoteTokenSymbol: string
    let baseTokenDecimals: number
    let quoteTokenDecimals: number
    let flipRatio: boolean
    let tickLower: number
    let tickUpper: number
    let tickCurrent: number
    let tickSpacing: number
    let fee: number
    let poolAddress: string

    beforeEach(async () => {
      tokenId = 123
      quoteTokenAddress = '0x1234567890123456789123456789012345678901'
      baseTokenAddress = '0xabcdeabcdefabcdefabcdefabcdefabcdefabcdf'
      quoteTokenSymbol = 'UNI'
      baseTokenSymbol = 'WETH'
      tickLower = -1000
      tickUpper = 2000
      tickCurrent = 40
      fee = 500
      baseTokenDecimals = await tokens[0].decimals()
      quoteTokenDecimals = await tokens[1].decimals()
      flipRatio = false
      tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM]
      poolAddress = `0x${'b'.repeat(40)}`
    })

    it('matches the current snapshot', async () => {
      const svg = await nftDescriptor.generateSVGImage({
        tokenId,
        baseTokenAddress,
        quoteTokenAddress,
        baseTokenSymbol,
        quoteTokenSymbol,
        baseTokenDecimals,
        quoteTokenDecimals,
        flipRatio,
        tickLower,
        tickUpper,
        tickCurrent,
        tickSpacing,
        fee,
        poolAddress,
      })

      expect(svg).toMatchSnapshot()
      fs.writeFileSync('./test/__snapshots__/NFTDescriptor.svg', svg)
    })

    it('returns a valid SVG', async () => {
      const svg = await nftDescriptor.generateSVGImage({
        tokenId,
        baseTokenAddress,
        quoteTokenAddress,
        baseTokenSymbol,
        quoteTokenSymbol,
        baseTokenDecimals,
        quoteTokenDecimals,
        flipRatio,
        tickLower,
        tickUpper,
        tickCurrent,
        tickSpacing,
        fee,
        poolAddress,
      })
      expect(isSvg(svg)).to.eq(true)
    })
  })

  describe('#isRare', () => {
    it('returns true sometimes', async () => {
      expect(await nftDescriptor.isRare(1, `0x${'b'.repeat(40)}`)).to.eq(true)
    })

    it('returns false sometimes', async () => {
      expect(await nftDescriptor.isRare(2, `0x${'b'.repeat(40)}`)).to.eq(false)
    })
  })

  function constructTokenMetadata(
    tokenId: number,
    quoteTokenAddress: string,
    baseTokenAddress: string,
    poolAddress: string,
    quoteTokenSymbol: string,
    baseTokenSymbol: string,
    flipRatio: boolean,
    tickLower: number,
    tickUpper: number,
    tickCurrent: number,
    feeTier: string,
    prices: string
  ): { name: string; description: string } {
    quoteTokenSymbol = quoteTokenSymbol.replace(/"/gi, '"')
    baseTokenSymbol = baseTokenSymbol.replace(/"/gi, '"')
    return {
      name: `Uniswap - ${feeTier} - ${quoteTokenSymbol}/${baseTokenSymbol} - ${prices}`,
      description: `This NFT represents a liquidity position in a Uniswap V3 ${quoteTokenSymbol}-${baseTokenSymbol} pool. The owner of this NFT can modify or redeem the position.\n\
\nPool Address: ${poolAddress}\n${quoteTokenSymbol} Address: ${quoteTokenAddress.toLowerCase()}\n${baseTokenSymbol} Address: ${baseTokenAddress.toLowerCase()}\n\
Fee Tier: ${feeTier}\nToken ID: ${tokenId}\n\n⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as \
token symbols may be imitated.`,
    }
  }
})
