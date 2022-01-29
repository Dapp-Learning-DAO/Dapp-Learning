const ethers = require("ethers");
const zksync = require("zksync");
require('dotenv').config();
const getZkWallet = require("./utils/zkwallet");
const getZkAccountInfo = require("./utils/zkaccount");
const depositETHToZksync = require("./utils/L1ToL2transfer");
const sendTx = require("./utils/L2ToL2transfer");
const withdrawETHTo = require("./utils/L2ToL1transfer");

/////////////////

async function main() {
  const _privKey = process.env.PRIVATE_KEY;
  const targetAddress = "0x3238f24e7C752398872B768Ace7dd63c54CfEFEc";
  const providerURL = process.env.ZKSYNC_PROVIDER_URL;
  const targetNetwork = process.env.TARGET_TEST_NET;

  const zkWalletObj = await getZkWallet(targetNetwork, _privKey, providerURL);
  const accountInfo = await getZkAccountInfo(zkWalletObj);

  console.log({ accountInfo });

  const cost = 0.01 // 转账金额
  const costStr = cost.toString();

  // L1 转账到 L2
  await depositETHToZksync(zkWalletObj, zkWalletObj.address(), costStr);

  // L2 到 L2 转账
  const transfer = await sendTx(zkWalletObj, targetAddress, costStr);
  const tx = transfer.txData.tx;
  console.log({tx});

  // L2 到 L1 转账
  await withdrawETHTo(zkWalletObj,zkWalletObj.address(),costStr);

}

main()
