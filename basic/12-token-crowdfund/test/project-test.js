const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Project contract', function () {
  let projectContractFactory
  let projectContract
  let creator
  let donator1
  let donator2

  beforeEach(async function () {
    ;[creator, donator1, donator2] = await ethers.getSigners()
    projectContractFactory = await ethers.getContractFactory('Project')
    const expiretime = parseInt(new Date().getTime() / 1000) + 7 * 24 * 60 * 60  //  项目时间设为7天

    projectContract = await projectContractFactory.deploy(
      creator.address,
      'Buy some toys',
      'Buy some toys',
      expiretime,
      100
    )

    expect(projectContract.address).to.not.be.null
  })

  it('Get details of a new project', async function () {
    let projectDetail = await projectContract.getDetails()
    expect(projectDetail.goalAmount).to.equal(100)
  })

  it('Get the complete time', async function () {
    await projectContract.checkIfFundingCompleteOrExpired()
    expect(parseInt(await projectContract.completeAt())).to.not.equal(null)
  })

  it('Donate with calling contribute ', async function () {
    const donation = { value: 10 }

    await projectContract.connect(donator1).contribute(donation)

    expect(parseInt(await projectContract.currentBalance())).to.equal(10)
  })

  it('Donate 101', async function () {
    const donation = { value: 101 }

    await projectContract.connect(donator1).contribute(donation)

    expect(parseInt(await projectContract.state())).to.equal(2)
  })
})
