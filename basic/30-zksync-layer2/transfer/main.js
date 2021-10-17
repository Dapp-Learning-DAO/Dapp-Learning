const ethers = require("ethers")
const zksync = require("zksync")
require('dotenv').config()

async function getZkWallet(privKey) {

  const provider = new ethers.providers.InfuraProvider(
    'ropsten',
    process.env.INFURA_API_KEY
  );

  const ethWallet = new ethers.Wallet(privKey, provider)
  const zkProvider = await zksync.Provider.newHttpProvider("https://ropsten-api.zksync.io/jsrpc");

  const zkWallet = await zksync.Wallet.fromEthSigner(ethWallet, zkProvider)
  return zkWallet
}

async function getZkAccountInfo(zkWallet) {
  // Committed state is not final yet
  let committedETHBalance = await zkWallet.getBalance("ETH")

  // Verified state is final
  const verifiedETHBalance = await zkWallet.getBalance("ETH", "verified")

  const accountId = await zkWallet.getAccountId()

  let isSigningKeySet = false
  let ethBalance = 0.0
  let extra = {}

  if (accountId == undefined) {
    extra["accountId"] = "Unknown Account Id"
  } else {
    isSigningKeySet = await zkWallet.isSigningKeySet()

    /// AccountState
    const state = await zkWallet.getAccountState()
    const committedBalances = state.committed.balances

    committedETHBalance = committedBalances["ETH"]
    ethBalance = ethers.utils.formatEther(committedETHBalance)
  }

  let account = {}

  account["accountId"] = accountId
  account["committedETHBalance"] = committedETHBalance
  account["verifiedETHBalance"] = verifiedETHBalance
  account["isSigningKeySet"] = isSigningKeySet
  account["ethBalance"] = ethBalance
  account["extra"] = extra

  return account
}

async function depositETHToZksync(zkWallet, newAddr, costEth) { // L2 to L1
  const deposit = await zkWallet.depositToSyncFromEthereum({
    depositTo: newAddr, // 可以给自己的地址转账
    token: "ETH",
    amount: ethers.utils.parseEther(costEth),
  })

  console.log("转账完成")
  console.log({deposit})
}

async function sendTx(zkWallet, newAddr, cost) { // L2 to L2
  const isSigningKeySet = await zkWallet.isSigningKeySet()

  console.log("isSigningKeySet: ", isSigningKeySet)

  // L2 转账前，必须先解锁
  if (!isSigningKeySet) {

    if ((await zkWallet.getAccountId()) == undefined) {
      throw new Error("Unknown Account Id")
    }

    console.log("签名ing")

    // As any other kind of transaction, `ChangePubKey` transaction requires fee.
    // User doesn't have (but can) to specify the fee amount. If omitted, library will query zkSync node for
    // the lowest possible amount.
    const changePubkey = await zkWallet.setSigningKey({
      ethAuthType: "ECDSA", // 显式指定验证类型
      feeToken: "ETH",
      // fee: ethers.utils.parseEther("0.0002") 可以不设置fee
    })

    // Wait until the tx is committed
    const receipt = await changePubkey.awaitReceipt()

    console.log("changePubkey: ", changePubkey)
    console.log()
    console.log("receipt: ", receipt)
  }

  const amount = zksync.utils.closestPackableTransactionAmount(
    ethers.utils.parseEther(cost))

  console.log("转账ing")

  const transfer = await zkWallet.syncTransfer({
    to: newAddr,
    token: "ETH",
    amount,
    // fee, 可以不设置
  })

  return transfer
}

/////////////////

async function example() {
  const _privKey = process.env.PRIVATE_KEY
  const toAddr = process.env.toAddr

  const zkWalletObj = await getZkWallet(_privKey)
  const accountInfo = await getZkAccountInfo(zkWalletObj)

  console.log({ accountInfo})

  const cost = 0.01 // 转账金额
  const costStr = cost.toString()

  const transfer = await sendTx(zkWalletObj, toAddr, costStr)
  const tx = transfer.txData.tx
  console.log({tx})

  console.log("正在从L2转账到L1，请耐心等待")
  depositETHToZksync(zkWalletObj, zkWalletObj.address(), costStr)
}

example()
