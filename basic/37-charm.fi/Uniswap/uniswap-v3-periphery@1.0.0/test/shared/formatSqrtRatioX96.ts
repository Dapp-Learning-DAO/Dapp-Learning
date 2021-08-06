import { BigNumber } from 'ethers'
import Decimal from 'decimal.js'

const TWO = BigNumber.from(2)
const TEN = BigNumber.from(10)
const FIVE_SIG_FIGS_POW = new Decimal(10).pow(5)

export function formatSqrtRatioX96(
  sqrtRatioX96: BigNumber | number,
  decimalsToken0: number = 18,
  decimalsToken1: number = 18
): string {
  Decimal.set({ toExpPos: 9_999_999, toExpNeg: -9_999_999 })

  let ratioNum = ((parseInt(sqrtRatioX96.toString()) / 2 ** 96) ** 2).toPrecision(5)
  let ratio = new Decimal(ratioNum.toString())

  // adjust for decimals
  if (decimalsToken1 < decimalsToken0) {
    ratio = ratio.mul(TEN.pow(decimalsToken0 - decimalsToken1).toString())
  } else if (decimalsToken0 < decimalsToken1) {
    ratio = ratio.div(TEN.pow(decimalsToken1 - decimalsToken0).toString())
  }

  if (ratio.lessThan(FIVE_SIG_FIGS_POW)) {
    return ratio.toPrecision(5)
  }

  return ratio.toString()
}
