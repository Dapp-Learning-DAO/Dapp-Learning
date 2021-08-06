import { waffle, ethers } from 'hardhat'
import { FeeAmount } from './shared/constants'

import { expect } from './shared/expect'

import { PathTest } from '../typechain'
import { decodePath, encodePath } from './shared/path'

import snapshotGasCost from './shared/snapshotGasCost'

describe('Path', () => {
  const wallets = waffle.provider.getWallets()

  let path: PathTest

  let tokenAddresses = [
    '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  ]
  let fees = [FeeAmount.MEDIUM, FeeAmount.MEDIUM]

  const pathTestFixture = async () => {
    const pathTestFactory = await ethers.getContractFactory('PathTest')
    return (await pathTestFactory.deploy()) as PathTest
  }

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before('create fixture loader', async () => {
    loadFixture = waffle.createFixtureLoader(wallets)
  })

  beforeEach('deploy PathTest', async () => {
    path = await loadFixture(pathTestFixture)
  })

  it('js encoding works as expected', async () => {
    let expectedPath =
      '0x' +
      tokenAddresses
        .slice(0, 2)
        .map((tokenAddress) => tokenAddress.slice(2).toLowerCase())
        .join('000bb8')
    expect(encodePath(tokenAddresses.slice(0, 2), fees.slice(0, 1))).to.eq(expectedPath)

    expectedPath = '0x' + tokenAddresses.map((tokenAddress) => tokenAddress.slice(2).toLowerCase()).join('000bb8')
    expect(encodePath(tokenAddresses, fees)).to.eq(expectedPath)
  })

  it('js decoding works as expected', async () => {
    const encodedPath = encodePath(tokenAddresses, fees)
    const [decodedTokens, decodedFees] = decodePath(encodedPath)
    expect(decodedTokens).to.deep.eq(tokenAddresses)
    expect(decodedFees).to.deep.eq(fees)
  })

  describe('#hasMultiplePools / #decodeFirstPool / #skipToken / #getFirstPool', () => {
    const encodedPath = encodePath(tokenAddresses, fees)

    it('works on first pool', async () => {
      expect(await path.hasMultiplePools(encodedPath)).to.be.true

      const firstPool = await path.decodeFirstPool(encodedPath)
      expect(firstPool.tokenA).to.be.eq(tokenAddresses[0])
      expect(firstPool.tokenB).to.be.eq(tokenAddresses[1])
      expect(firstPool.fee).to.be.eq(FeeAmount.MEDIUM)

      expect(await path.decodeFirstPool(await path.getFirstPool(encodedPath))).to.deep.eq(firstPool)
    })

    const offset = 20 + 3

    it('skips 1 item', async () => {
      const skipped = await path.skipToken(encodedPath)
      expect(skipped).to.be.eq('0x' + encodedPath.slice(2 + offset * 2))

      expect(await path.hasMultiplePools(skipped)).to.be.false

      const { tokenA, tokenB, fee: decodedFee } = await path.decodeFirstPool(skipped)
      expect(tokenA).to.be.eq(tokenAddresses[1])
      expect(tokenB).to.be.eq(tokenAddresses[2])
      expect(decodedFee).to.be.eq(FeeAmount.MEDIUM)
    })
  })

  it('gas cost', async () => {
    await snapshotGasCost(
      path.getGasCostOfDecodeFirstPool(encodePath([tokenAddresses[0], tokenAddresses[1]], [FeeAmount.MEDIUM]))
    )
  })
})
