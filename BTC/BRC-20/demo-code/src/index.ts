import {
  initEccLib,
  payments,
} from "bitcoinjs-lib";
import { ECPairFactory, ECPairAPI } from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import networks from "./networks";


import { startP2tr } from './demo/startP2tr';
import { startTapTree } from './demo/startTapTree';
import { startInscribeDeploy } from './demo/startInscribe_deploy';
import { startInscribeTransfer } from './demo/startInscribe_transfer';
import { startInscribeMint } from './demo/startInscribe_mint';
import { startInscribeMintWithNoSdk } from './demo/startInscribe_mint_no_sdk';

import dotEnv from 'dotenv';
import { addressToScriptPubKey, decodeScript } from "./utils";
dotEnv.config();

initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const network = networks.testnet;

async function start() {

  const privateKey = process.env.secret;
  const keypair = ECPair.fromWIF(privateKey, network);
  console.log("secretK = " + keypair.privateKey?.toString('hex'));
  console.log("publicK = " + keypair.publicKey?.toString('hex'));
  console.log("\r\n");

  await startP2tr(keypair); // 介绍了taproot地址是怎么生成以及怎么进行转账的
  // await startTapTree(keypair); // 参考博客文章，对taproot的脚本创建以，花费taproot地址上的交易进行demo
  // await startInscribeDeploy(keypair) // deploy一个brc20的铭文
  // await startInscribeMint(keypair) // mint一个brc20的铭文
  // await startInscribeTransfer(keypair); // 揭露一个transfer的brc20铭文
  // await startInscribeMintWithNoSdk(keypair) // 不用sdk，来mint brc20铭文
}

start().then(() => process.exit());