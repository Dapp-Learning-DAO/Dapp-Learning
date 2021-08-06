import { constants } from 'ethers'
import { waffle, ethers } from 'hardhat'
import { expect } from './shared/expect'
import { Fixture } from 'ethereum-waffle'
import { NonfungibleTokenPositionDescriptor, TestERC20 } from '../typechain'

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const TBTC = '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa'
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'

describe('NonfungibleTokenPositionDescriptor', () => {
  const [weth, ...wallets] = waffle.provider.getWallets()

  const nftPositionDescriptorCompleteFixture: Fixture<{
    tokens: [TestERC20, TestERC20, TestERC20, TestERC20, TestERC20]
    nftPositionDescriptor: NonfungibleTokenPositionDescriptor
  }> = async (wallets, provider) => {
    const tokenFactory = await ethers.getContractFactory('TestERC20')
    const nftDescriptorLibraryFactory = await ethers.getContractFactory('NFTDescriptor')
    const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy()
    const NonfungibleTokenPositionDescriptorFactory = await ethers.getContractFactory(
      'NonfungibleTokenPositionDescriptor',
      {
        libraries: {
          NFTDescriptor: nftDescriptorLibrary.address,
        },
      }
    )
    const tokens = (await Promise.all([
      tokenFactory.deploy(constants.MaxUint256.div(2)), // do not use maxu25e6 to avoid overflowing
      tokenFactory.deploy(constants.MaxUint256.div(2)),
      tokenFactory.deploy(constants.MaxUint256.div(2)),
      tokenFactory.deploy(constants.MaxUint256.div(2)),
      tokenFactory.deploy(constants.MaxUint256.div(2)),
    ])) as [TestERC20, TestERC20, TestERC20, TestERC20, TestERC20]
    tokens.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1))

    const nftPositionDescriptor = (await NonfungibleTokenPositionDescriptorFactory.deploy(
      weth.address
    )) as NonfungibleTokenPositionDescriptor

    return {
      nftPositionDescriptor,
      tokens,
    }
  }

  let nftPositionDescriptor: NonfungibleTokenPositionDescriptor
  let tokens: [TestERC20, TestERC20, TestERC20, TestERC20, TestERC20]

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('load fixture', async () => {
    ;({ nftPositionDescriptor, tokens } = await loadFixture(nftPositionDescriptorCompleteFixture))
  })

  describe('#tokenRatioPriority', () => {
    it('returns -100 for WETH9', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(weth.address, 1)).to.eq(-100)
    })

    it('returns 200 for USDC', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(USDC, 1)).to.eq(300)
    })

    it('returns 100 for DAI', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(DAI, 1)).to.eq(100)
    })

    it('returns  150 for USDT', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(USDT, 1)).to.eq(200)
    })

    it('returns -200 for TBTC', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(TBTC, 1)).to.eq(-200)
    })

    it('returns -250 for WBTC', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(WBTC, 1)).to.eq(-300)
    })

    it('returns 0 for any non-ratioPriority token', async () => {
      expect(await nftPositionDescriptor.tokenRatioPriority(tokens[0].address, 1)).to.eq(0)
    })
  })

  describe('#flipRatio', () => {
    it('returns false if neither token has priority ordering', async () => {
      expect(await nftPositionDescriptor.flipRatio(tokens[0].address, tokens[2].address, 1)).to.eq(false)
    })

    it('returns true if both tokens are numerators but token0 has a higher priority ordering', async () => {
      expect(await nftPositionDescriptor.flipRatio(USDC, DAI, 1)).to.eq(true)
    })

    it('returns true if both tokens are denominators but token1 has lower priority ordering', async () => {
      expect(await nftPositionDescriptor.flipRatio(weth.address, WBTC, 1)).to.eq(true)
    })

    it('returns true if token0 is a numerator and token1 is a denominator', async () => {
      expect(await nftPositionDescriptor.flipRatio(DAI, WBTC, 1)).to.eq(true)
    })

    it('returns false if token1 is a numerator and token0 is a denominator', async () => {
      expect(await nftPositionDescriptor.flipRatio(WBTC, DAI, 1)).to.eq(false)
    })
  })
})
