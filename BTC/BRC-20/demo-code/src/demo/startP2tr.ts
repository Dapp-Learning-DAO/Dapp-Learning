import * as bitcoin from 'bitcoinjs-lib';
import {
  networks,
  payments,
  Psbt
} from "bitcoinjs-lib";
import { tweakSigner, toXOnly } from "../utils";
import { broadcast, waitUntilUTXO } from "../blockstream_utils";

const network = networks.testnet
export async function startP2tr(keypair: bitcoin.Signer) {
  console.log(`Running "Pay to Pubkey with taproot example"`);
  // Tweak the original keypair
  // 创建一个taproot的秘钥
  const tweakedSigner = tweakSigner(keypair, { network });
  // Generate an address from the tweaked public key
  // 生成一个taproot格式的地址
  const p2trPayment = payments.p2tr({
    pubkey: toXOnly(tweakedSigner.publicKey),
    network
  });
  const p2trAddr = p2trPayment.address ?? "";
  console.log(`Waiting till UTXO is detected at this Address: ${p2trAddr}`);

  // 等到链上给p2trAddress打钱 ，线下去领一些吧
  const utxos = await waitUntilUTXO(p2trAddr)
  console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

  // 我要去花这个p2trAddress上的钱
  // PSBT 是 Partially Signed Bitcoin Transaction 的缩写，即部分签名的比特币交易
  const psbt = new Psbt({ network });
  // 添加输入 
  psbt.addInput({
    hash: utxos[utxos.length - 1].txid,
    index: utxos[utxos.length - 1].vout,
    witnessUtxo: {
      value: utxos[utxos.length - 1].value,
      script: p2trPayment.output!
    },
    tapInternalKey: toXOnly(keypair.publicKey)
  });
  // 添加输出 - 往这个地址转账
  psbt.addOutputs([{
    address: "tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9",
    value: 9000
  }, {
    address: "tb1pjjq4snuntgja3ggyluncdlkvhxw26gm8pkfgjc8jvhh3asyaj6as4uctjg",
    value: utxos[utxos.length - 1].value - 10000 // 剩下的给自己, 1000给gas
  }]);

  // 用转化后的taproot私钥进行签名
  psbt.signInput(0, tweakedSigner);
  // 所有的输入被正确签名后，完成整个交易 这个都不用script redeem的 
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
  const txid = await broadcast(tx.toHex());
  console.log(`Success! Txid is ${txid}`);
}
