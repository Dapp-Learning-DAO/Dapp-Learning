const crypto = require('crypto')

// Format required for sending bytes through eth client:
//  - hex string representation
//  - prefixed with 0x
const bufToStr = b => '0x' + b.toString('hex')

const sha256 = x =>
  crypto
    .createHash('sha256')
    .update(x)
    .digest()

const random32 = () => crypto.randomBytes(32)

const isSha256Hash = hashStr => /^0x[0-9a-f]{64}$/i.test(hashStr)

const newSecretHashPair = () => {
  const secret = random32()
  const hash = sha256(secret)
  return {
    secret: bufToStr(secret),
    hash: bufToStr(hash),
  }
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

const htlcArrayToObj = c => {
  return {
    sender: c[0],
    receiver: c[1],
    amount: c[2],
    hashlock: c[3],
    timelock: c[4],
    withdrawn: c[5],
    refunded: c[6],
    preimage: c[7],
  }
}

const htlcERC20ArrayToObj = c => {
  return {
    sender: c[0],
    receiver: c[1],
    token: c[2],
    amount: c[3],
    hashlock: c[4],
    timelock: c[5],
    withdrawn: c[6],
    refunded: c[7],
    preimage: c[8],
  }
}

const getBalance = async (address) => web3.utils.toBN(await web3.eth.getBalance(address))

module.exports = {
  bufToStr,
  getBalance,
  htlcArrayToObj,
  htlcERC20ArrayToObj,
  isSha256Hash,
  newSecretHashPair,
  nowSeconds,
  random32,
  sha256,
}
