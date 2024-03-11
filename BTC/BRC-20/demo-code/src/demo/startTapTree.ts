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
import { tweakSigner, toXOnly } from "../utils";
import { broadcast, waitUntilUTXO } from "../blockstream_utils";
import { witnessStackToScriptWitness } from '../witness_stack_to_script_witness';

import type { Taptree } from "bitcoinjs-lib/src/types";

const network = networks.testnet;

/**
 *  创建一个多条路径支付的taptree
 *  路径1：用公私钥
 *  路径2: 用hash-lock
 */
export async function startTapTree(keypair: bitcoin.Signer) {
  // TapTree example
  console.log(`Running "Taptree example"`);


  /**
   *  
   * 创建一个2个lock script
   * 1-使用密码hash
   * 
   */
  const SECRET = "secret"; // 模拟一个密码
  const secretBytes = Buffer.from(SECRET);
  const hash = crypto.hash160(secretBytes); // 构建密码的hash
  const publicKey = toXOnly(keypair.publicKey);
  const hash_locking_script = script.compile([
    opcodes.OP_HASH160,
    hash,
    opcodes.OP_EQUALVERIFY,
    publicKey,
    opcodes.OP_CHECKSIG
  ]);
  /**·
   * 另一种写法
   */
  // const hash_script_asm = `OP_HASH160 ${hash.toString('hex')} OP_EQUALVERIFY ${publicKey.toString('hex')} OP_CHECKSIG`;
  // const hash_lock_script = script.fromASM(hash_script_asm);

  /**
 *  
 * 创建一个2个lock script
 * 2-使用公钥验签 公钥不用hash
 * 
 */
  const pk_locking_script = script.compile([
    publicKey,
    opcodes.OP_CHECKSIG
  ]);
  // 另一种写法
  // const p2pk_script_asm = `${publicKey.toString('hex')} OP_CHECKSIG`;
  // const pk_locking_script = script.fromASM(p2pk_script_asm);

  // 创建一个tap tree
  const scriptTree: Taptree = [
    {
      output: hash_locking_script
    },
    {
      output: pk_locking_script
    }
  ];
  // 创建taptree的taproot地址，然后我们把钱打到这个账户上，用下面账户来花
  const tapTreePayment = payments.p2tr({
    internalPubkey: toXOnly(keypair.publicKey),
    scriptTree,
    network
  });
  const tapTreeAddress = tapTreePayment.address ?? '';
  console.log(`tapTreeAddress = ${tapTreeAddress}`);

  async function redeem1() {

    // 账户1-密码hash验签的taptree账户
    const hashLockTapLeafH = payments.p2tr({
      internalPubkey: toXOnly(keypair.publicKey),
      scriptTree,
      redeem: {
        output: hash_locking_script,
        redeemVersion: 192,
      },
      network
    });

    console.log(`Waiting till UTXO is detected at this Address: ${tapTreeAddress}`);
    let utxos = await waitUntilUTXO(tapTreeAddress)
    console.log(`Trying the Hash lock spend path with UTXO ${utxos[0].txid}:${utxos[0].vout}`);

    const tapLeafScript = {
      leafVersion: 192,
      script: hash_locking_script,
      controlBlock: hashLockTapLeafH.witness![hashLockTapLeafH.witness!.length - 1]
    };

    const psbt = new Psbt({ network });
    psbt.addInput({
      hash: utxos[0].txid,
      index: utxos[0].vout,
      witnessUtxo: { value: utxos[0].value, script: hashLockTapLeafH.output! },
      tapLeafScript: [
        tapLeafScript
      ]
    });

    psbt.addOutput({
      address: "tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9", // faucet address
      value: utxos[0].value - 1000
    });

    psbt.signInput(0, keypair);
    // We have to construct our witness script in a custom finalizer
    const customFinalizer = (_inputIndex: number, input: any) => {
      const scriptSolution = [
        input.tapScriptSig[0].signature,
        secretBytes
      ];
      const witness = scriptSolution
        .concat(tapLeafScript.script)
        .concat(tapLeafScript.controlBlock);

      return {
        finalScriptWitness: witnessStackToScriptWitness(witness)
      }
    }
    psbt.finalizeInput(0, customFinalizer);

    let tx = psbt.extractTransaction();
    console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
    let txid = await broadcast(tx.toHex());
    console.log(`Success! Txid is ${txid}`);
  }

  // 我们用publicKey来花taproot地址上的钱
  async function redeem2() {
    // 账户2-公钥验签的taptree账户
    const pkLockTapLeaf = payments.p2tr({
      internalPubkey: toXOnly(keypair.publicKey),
      scriptTree,
      redeem: {
        output: pk_locking_script,
        redeemVersion: 192,
      },
      network
    });
    console.log(`Waiting till UTXO is detected at this Address: ${tapTreeAddress}`);
    let utxos = await waitUntilUTXO(tapTreeAddress)
    console.log(`Trying the P2PK path with UTXO ${utxos[0].txid}:${utxos[0].vout}`);
    const psbt = new Psbt({ network });
    // 从这个taproot地址上发起转账，用p2pk_p2tr来解锁
    const tapLeafScript =
    {
      leafVersion: 192,
      script: pk_locking_script,
      controlBlock: pkLockTapLeaf.witness![pkLockTapLeaf.witness!.length - 1]
    };
    psbt.addInput({
      hash: utxos[0].txid,
      index: utxos[0].vout,
      witnessUtxo: {
        value: utxos[0].value,
        script: pkLockTapLeaf.output!
      },
      tapLeafScript: [
        tapLeafScript
      ]
    });
    // 留了1000给gas
    psbt.addOutput({
      address: "tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9",
      value: utxos[0].value - 1000
    });

    psbt.signInput(0, keypair);
    psbt.finalizeAllInputs();

    let tx = psbt.extractTransaction();
    console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
    let txid = await broadcast(tx.toHex());
    console.log(`Success! Txid is ${txid}`);
  }



  /**
   * 第三种，直接用taptree的私钥来转移，更简单，在发铭文的使用用得到
   * We can also spend from this address without using the script tree
   * 
   */
  async function redeem3() {
    console.log(`Waiting till UTXO is detected at this Address: ${tapTreeAddress}`);
    const utxos = await waitUntilUTXO(tapTreeAddress)
    console.log(`Trying the Hash lock spend path with UTXO ${utxos[0].txid}:${utxos[0].vout}`);

    const psbt = new Psbt({ network });
    psbt.addInput({
      hash: utxos[0].txid,
      index: utxos[0].vout,
      witnessUtxo: { value: utxos[0].value, script: tapTreePayment.output! },
      tapInternalKey: toXOnly(keypair.publicKey),
      tapMerkleRoot: tapTreePayment.hash // hash等于merklet root
    });
    psbt.addOutput({
      address: "tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9",
      value: utxos[0].value - 1000
    });
    // We need to create a signer tweaked by script tree's merkle root
    // 我们生成一个merkle root的signer
    const tweakedSigner = tweakSigner(keypair, { tweakHash: tapTreePayment.hash });
    psbt.signInput(0, tweakedSigner);
    psbt.finalizeAllInputs();

    const tx = psbt.extractTransaction();
    console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
    const txid = await broadcast(tx.toHex());
    console.log(`Success! Txid is ${txid}`);

  }

  await redeem3();
}