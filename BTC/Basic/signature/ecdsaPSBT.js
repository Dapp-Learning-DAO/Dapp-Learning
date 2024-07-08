import ecpair from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import bitcoin from 'bitcoinjs-lib';

/// In this example, We get keyPair from WIF.
/// We then construct a PSBT with one input (which you're spending) and one output (where you're sending bitcoins).
/// The PSBT is signed using the private key.
/// Finally, we build the PSBT and print its hexadecimal representation.

const { ECPairFactory } = ecpair;
const ECPair = ECPairFactory(tinysecp);

// Get keyPair from WIF
const keyPair = ECPair.fromWIF('L2uPYXe17xSTqbCjZvL2DsyXPCbXspvcu5mHLDYUgzdUbZGSKrSr');

// Create a new PSBT with the first input of the transaction
let psbt = new bitcoin.Psbt()
  .addInput({
    hash: '7d067b4a697a09d2c3cff7d4d9506c9955e93bff41bf82d439da7d030382bc3e',
    index: 0,
    nonWitnessUtxo: Buffer.from(
      '0200000001f9f34e95b9d5c8abcd20fc5bd4a825d1517be62f0f775e5f36da944d9' +
        '452e550000000006b483045022100c86e9a111afc90f64b4904bd609e9eaed80d48' +
        'ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc566020' +
        '9e761da46e1c2f1152ec013215801210211755115eabf846720f5cb18f248666fec' +
        '631e5e1e66009ce3710ceea5b1ad13ffffffff01905f0100000000001976a9148bb' +
        'c95d2709c71607c60ee3f097c1217482f518d88ac00000000',
      'hex'
    ),
  })
  .addOutput({
    address: '1KRMKfeZcmosxALVYESdPNez1AP1mEtywp',
    value: 80000,
  });

// Sign the first input with the key
psbt.signInput(0, keyPair);

// Finalize the inputs
psbt.finalizeAllInputs();

// Extract the transaction
const rawTx = psbt.extractTransaction().toHex();

// Print the transaction
console.log(`Raw Transaction: ${rawTx}`);
