require("@nomiclabs/hardhat-waffle")
const { expect } = require("chai")

const toWei = (value) => ethers.utils.parseEther(value.toString())

const fromWei = (value) =>
  ethers.utils.formatEther(typeof value === "string" ? value : value.toString())

const getBalance = ethers.provider.getBalance

describe("Exchange", async () => {
  let owner
  let user
  let exchange

  beforeEach(async () => {
    ;[owner, user] = await ethers.getSigners()

    const Token = await ethers.getContractFactory("Token")
    token = await Token.deploy("Token", "TKN", toWei(1000000))
    await token.deployed()

    const Exchange = await ethers.getContractFactory("Exchange")
    exchange = await Exchange.deploy(token.address)
    await exchange.deployed()
  })

  describe("addLiquidity", async () => {
    it("adds liquidity", async () => {
      await token.approve(exchange.address, toWei(200))
      await exchange.addLiquidity(toWei(200), { value: toWei(100) })

      expect(await getBalance(exchange.address)).to.equal(toWei(100))
      expect(await exchange.getReserve()).to.equal(toWei(200))
    })
  })

  describe("getPrice", async () => {
    it("returns correct prices", async () => {
      await token.approve(exchange.address, toWei(2000))
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) })

      const tokenReserve = await exchange.getReserve()
      const etherReserve = await getBalance(exchange.address)

      // ETH per token
      expect(
        (await exchange.getPrice(etherReserve, tokenReserve)).toString()
      ).to.eq("0.5")

      // token per ETH
      expect(await exchange.getPrice(tokenReserve, etherReserve).to.eq("0.5"))
    })
  })
})
