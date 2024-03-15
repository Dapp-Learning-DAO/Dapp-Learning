import { Buff } from '@cmdcode/buff-utils'
import { broadcast, waitUntilUTXO } from "../blockstream_utils";
import { Address, Signer, Tap, Tx, } from '@cmdcode/tapscript'
import { ECPairInterface } from 'ecpair';
import { toXOnly } from '../utils';



/**
 * 注：以下代码里里，我用了@cmdcode/tapscript的sdk，不再是coinjs-lib的原生代码
 * @param keypair 
 */
export async function startInscribeDeploy(keypair: ECPairInterface) {
  // TapTree example
  console.log(`Running "Inscribe example"`);

  // The 'marker' bytes. Part of the ordinal inscription format.
  const marker = Buff.encode('ord')
  /* Specify the media type of the file. Applications use this when rendering 
   * content. See: https://developer.mozilla.org/en-US/docs/Glossary/MIME_type 
   */
  const mimetype = Buff.encode('text/plain')
  const textdata = Buff.encode(`{ "p": "brc-20", "op": "deploy", "tick": "coda", "max": "21000000", "lim": "1000" }`);

  const pubkey = toXOnly(keypair.publicKey)
  // Basic format of an 'inscription' script.
  const script = [pubkey, 'OP_CHECKSIG', 'OP_0', 'OP_IF', marker, mimetype, textdata, 'OP_ENDIF']
  // For tapscript spends, we need to convert this script into a 'tapleaf'.
  const tapleaf = Tap.encodeScript(script)
  console.log('tapleaf:', tapleaf)
  // 生成一个taproot的地址
  // Generate a tapkey that includes our leaf script. Also, create a merlke proof 
  // (cblock) that targets our leaf and proves its inclusion in the tapkey.
  const [tpubkey, cblock] = Tap.getPubKey(pubkey, { target: tapleaf })
  // A taproot address is simply the tweaked public key, encoded in bech32 format.
  const address = Address.p2tr.fromPubKey(tpubkey, 'testnet')
  console.log('Your address:', address)


  /* 现在，发送100_000 sats到上面这个地址。 
     并且记录下txid 和vount
     然后在redeem的时候填上这些信息
   * NOTE: To continue with this example, send 100_000 sats to the above address.
   * You will also need to make a note of the txid and vout of that transaction,
   * so that you can include that information below in the redeem tx.
   */

  // 从这个地址上给上面账户打钱
  const utxos = await waitUntilUTXO(address);
  console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

  const txdata = Tx.create({
    vin: [{
      // Use the txid of the funding transaction used to send the sats.
      txid: utxos[0].txid,
      // Specify the index value of the output that you are going to spend from.
      vout: utxos[0].vout,
      // Also include the value and script of that ouput.
      prevout: {
        // Feel free to change this if you sent a different amount.
        value: 1100,
        // This is what our address looks like in script form.
        scriptPubKey: [tpubkey]
      },
    }],
    vout: [{
      // We are leaving behind 1000 sats as a fee to the miners.
      value: 1000,
      // This is the new script that we are locking our funds to. 发的一个地址
      scriptPubKey: Address.toScriptPubKey('tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9')
    }]
  })

  // For this example, we are signing for input 0 of our transaction,
  // using the untweaked secret key. We are also extending the signature 
  // to include a commitment to the tapleaf script that we wish to use.
  const sig = Signer.taproot.sign(keypair.privateKey!.toString('hex'), txdata, 0, { extension: tapleaf })

  // Add the signature to our witness data for input 0, along with the script
  // and merkle proof (cblock) for the script.
  txdata.vin[0].witness = [sig, script, cblock]

  // Check if the signature is valid for the provided public key, and that the
  // transaction is also valid (the merkle proof will be validated as well).
  const isValid = Signer.taproot.verify(txdata, 0, { pubkey, throws: true })

  console.log('Your txhex:', Tx.encode(txdata).hex)
  console.dir(txdata, { depth: null })
  console.log('Transaction should pass validation.', isValid)
  let txid = await broadcast(Tx.encode(txdata).hex);
  console.log(`Success! Txid is ${txid}`);
}