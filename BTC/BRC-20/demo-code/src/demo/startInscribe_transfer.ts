import { Buff } from '@cmdcode/buff-utils'
import { broadcast, waitUntilUTXO, getTxData } from "../blockstream_utils";
import { Address, Signer, Tap, Tx, } from '@cmdcode/tapscript'
import { ecc } from '@cmdcode/crypto-utils'
import { ECPairInterface, ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import { toXOnly } from '../utils';

export async function startInscribeTransfer(keypair: ECPairInterface) {
  // TapTree example
  console.log(`Running "Inscribe example"`);
  const pubKey = ecc.getPublicKey(keypair.privateKey!, true).toHex();
  const [tpubkey] = Tap.getPubKey(pubKey)
  const address3 = Address.p2tr.encode(tpubkey, 'testnet')
  console.log(address3);
  // The 'marker' bytes. Part of the ordinal inscription format.
  const marker = Buff.encode('ord')
  /* Specify the media type of the file. Applications use this when rendering 
   * content. See: https://developer.mozilla.org/en-US/docs/Glossary/MIME_type 
   */
  const mimetype = Buff.encode('text/plain')
  const textdata = Buff.encode(`{ "p": "brc-20", "op": "transfer", "tick": "coda", "amt": "200" }`);

  const pubkey = toXOnly(keypair.publicKey)
  // Basic format of an 'inscription' script.
  const script = [pubkey, 'OP_CHECKSIG', 'OP_0', 'OP_IF', marker, '01', mimetype, 'OP_0', textdata, 'OP_ENDIF']
  // For tapscript spends, we need to convert this script into a 'tapleaf'.
  const tapleaf = Tap.encodeScript(script)
  console.log('tapleaf:', tapleaf)
  // 生成一个taproot的地址
  // Generate a tapkey that includes our leaf script. Also, create a merlke proof 
  // (cblock) that targets our leaf and proves its inclusion in the tapkey.
  const [tapLeafPubkey, cblock] = Tap.getPubKey(pubkey, { target: tapleaf })
  // A taproot address is simply the tweaked public key, encoded in bech32 format.
  const address = Address.p2tr.fromPubKey(tapLeafPubkey, 'testnet')
  console.log('Your address:', address)


  /* 现在，发送sats到上面这个地址。 
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
        value: utxos[0].value,
        // This is what our address looks like in script form.
        scriptPubKey: ['OP_1', tapLeafPubkey]
      },
    }],
    vout: [{
      value: 800,
      // This is the new script that we are locking our funds to. 发的一个地址
      scriptPubKey: Address.toScriptPubKey(address3)
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
  console.log('Transaction should pass validation.', isValid)

  const txhex = Tx.encode(txdata).hex;
  console.log('Your txhex:', txhex)
  console.dir(txdata, { depth: null })
  let txid = await broadcast(Tx.encode(txdata).hex);
  console.log(`Success! Txid is ${txid}`);


}
