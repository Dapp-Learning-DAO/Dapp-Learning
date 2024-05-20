import * as bitcoin from 'bitcoinjs-lib';
import {
  opcodes,
  networks,
  initEccLib,
  script,
  payments,
  crypto,
  Psbt
} from "bitcoinjs-lib";
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import { tweakSigner, toXOnly, opPush } from "../utils";
import { broadcast, waitUntilUTXO } from "../blockstream_utils";
import { witnessStackToScriptWitness } from '../witness_stack_to_script_witness';
import { Taptree, Tapleaf } from 'bitcoinjs-lib/src/types';
import { ECPairInterface } from 'ecpair';

const network = networks.testnet;


/**
 * 这里我用了@cmdcode/tapscript的sdk，
 * @param keypair 
 */
export async function startInscribeMintWithNoSdk(keypair: ECPairInterface) {
  // TapTree example
  console.log(`Running "startInscribeMintWithNoSdk"`);

  // 拿到p2tr类型的公钥
  const tweakedPublicKey = toXOnly(keypair.publicKey)
  const json = `{ "p": "brc-20", "op": "transfer", "tick": "cccc", "amt": "100" }`;

  // 构建铭文的script
  const inscriptionWitnessScript = bitcoin.script.compile([
    tweakedPublicKey,
    opcodes.OP_CHECKSIG, // 验证公钥

    opcodes.OP_FALSE, // referred to as an ENVELOPE
    opcodes.OP_IF, // adding false enables prunable content
    opPush("ord"), // specifies its an ordinal inscription
    1,
    1,
    opPush("text/plain;charset=utf-8"), // defines media type
    opcodes.OP_0,
    opPush(json), // media content
    bitcoin.opcodes.OP_ENDIF // end of ENVELOPE
  ]);

  // 构建另一个支付条件
  // const recover_witness_script = bitcoin.script.compile([tweakedPublicKey,
  //   bitcoin.opcodes.OP_CHECKSIG]);
  // // 构建一个tap tree
  // const scriptTree: Taptree = [
  //   { output: inscriptionWitnessScript },
  //   {
  //     output: recover_witness_script
  //   }
  // ];

  const scriptTree = {
    output: inscriptionWitnessScript,
  };

  const redeemScript = {
    output: inscriptionWitnessScript,
    redeemVersion: 192
  }

  // 这个就是一个包含了铭文的p2tr
  const inscriptionPayment = bitcoin.payments.p2tr({
    internalPubkey: tweakedPublicKey,
    network: network,
    scriptTree: scriptTree,
    redeem: redeemScript, // 这个需要吗？ 是的，需要的，因为这是用来解锁taproot上资产的
  });

  const commitAndRevealAddress = inscriptionPayment.address; // 返回铭文的地址
  console.log(`commit_and_reveal_address = `, commitAndRevealAddress)

  // 从这个地址上给上面账户打钱
  const utxos = await waitUntilUTXO(commitAndRevealAddress);
  console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

  // 
  // PSBT 是 Partially Signed Bitcoin Transaction 的缩写，即部分签名的比特币交易
  // 构建PSBT去花这个inscriptionPayment.address上的钱
  const psbt = new Psbt({ network });
  const tapLeafScript = {
    leafVersion: 192,
    script: inscriptionWitnessScript,
    controlBlock: inscriptionPayment.witness![inscriptionPayment.witness!.length - 1]
  };
  // 或者这么写
  // const tapLeafScript2 = {
  //   leafVersion: inscriptionPayment.redeemVersion,
  //   script: inscriptionPayment.redeem!.output!,
  //   controlBlock: inscriptionPayment.witness![inscriptionPayment.witness!.length - 1]
  // }
  // console.log(inscriptionWitnessScript.equals(inscriptionPayment.redeem!.output!));

  // 添加输入 
  psbt.addInput({
    hash: utxos[utxos.length - 1].txid,
    index: utxos[utxos.length - 1].vout,
    // tapInternalKey: tweakedPublicKey,
    witnessUtxo: {
      value: utxos[utxos.length - 1].value,
      script: inscriptionPayment.output!
    },
    tapLeafScript: [
      tapLeafScript,
    ]
  });
  // 添加输出
  psbt.addOutputs([{
    // 往这个地址发铭文
    address: "tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9",
    value: 1000
  }, {
    // 找零地址
    address: "tb1pjjq4snuntgja3ggyluncdlkvhxw26gm8pkfgjc8jvhh3asyaj6as4uctjg",
    value: utxos[utxos.length - 1].value - 1000 - 1000 // 扣除上面的1000, 再扣除1000给gas
  }]);

  // 签名
  psbt.signInput(0, keypair);
  // 验证所有的input都被正确签名了，
  psbt.finalizeAllInputs();
  // 拿到tx数据
  const tx = psbt.extractTransaction().toHex();
  console.log(`Broadcasting Transaction Hex: ${tx}`);
  // 广播交易
  const txid = await broadcast(tx);
  console.log(`Success! Txid is ${txid}`);

}