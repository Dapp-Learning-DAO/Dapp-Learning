import { ethers, waffle } from 'hardhat'
import { TestMulticall } from '../typechain/TestMulticall'
import { expect } from './shared/expect'

import snapshotGasCost from './shared/snapshotGasCost'

describe('Multicall', async () => {
  const wallets = waffle.provider.getWallets()

  let multicall: TestMulticall

  beforeEach('create multicall', async () => {
    const multicallTestFactory = await ethers.getContractFactory('TestMulticall')
    multicall = (await multicallTestFactory.deploy()) as TestMulticall
  })

  it('revert messages are returned', async () => {
    await expect(
      multicall.multicall([multicall.interface.encodeFunctionData('functionThatRevertsWithError', ['abcdef'])])
    ).to.be.revertedWith('abcdef')
  })

  it('return data is properly encoded', async () => {
    const [data] = await multicall.callStatic.multicall([
      multicall.interface.encodeFunctionData('functionThatReturnsTuple', ['1', '2']),
    ])
    const {
      tuple: { a, b },
    } = multicall.interface.decodeFunctionResult('functionThatReturnsTuple', data)
    expect(b).to.eq(1)
    expect(a).to.eq(2)
  })

  describe('context is preserved', () => {
    it('msg.value', async () => {
      await multicall.multicall([multicall.interface.encodeFunctionData('pays')], { value: 3 })
      expect(await multicall.paid()).to.eq(3)
    })

    it('msg.value used twice', async () => {
      await multicall.multicall(
        [multicall.interface.encodeFunctionData('pays'), multicall.interface.encodeFunctionData('pays')],
        { value: 3 }
      )
      expect(await multicall.paid()).to.eq(6)
    })

    it('msg.sender', async () => {
      expect(await multicall.returnSender()).to.eq(wallets[0].address)
    })
  })

  it('gas cost of pay w/o multicall', async () => {
    await snapshotGasCost(multicall.pays({ value: 3 }))
  })

  it('gas cost of pay w/ multicall', async () => {
    await snapshotGasCost(multicall.multicall([multicall.interface.encodeFunctionData('pays')], { value: 3 }))
  })
})
