const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const secp256k1 = require('@bitcoinerlab/secp256k1');
const ECPair = ECPairFactory(secp256k1);

bitcoin.initEccLib(secp256k1);

const network = bitcoin.networks.testnet;

// Convert to x-only public key
function toXOnly(pubKey) {
  return Buffer.from(pubKey).slice(1, 33);
}

// Schnorr signer class
class SchnorrSigner {
  constructor(keyPair) {
    this.keyPair = keyPair;
    this.publicKey = toXOnly(keyPair.publicKey);
  }

  sign(hash) {
    return this.keyPair.sign(hash, true); // true enables Schnorr signing
  }

  signSchnorr(hash) {
    return this.sign(hash);
  }
}

// Create Taproot address
async function createTaprootAddress() {
  try {
    // Generate key pair
    const keyPair = ECPair.makeRandom({ network });
    
    // Create Schnorr signer
    const schnorrSigner = new SchnorrSigner(keyPair);
    
    const { address, output } = bitcoin.payments.p2tr({
      pubkey: schnorrSigner.publicKey,
      network,
    });

    return {
      signer: schnorrSigner,
      address,
      output
    };
  } catch (error) {
    console.error('Error in createTaprootAddress:', error);
    throw error;
  }
}

function addOpReturnOutput(psbt, message) {
  const data = Buffer.from(message, 'utf8');
  const embed = bitcoin.payments.embed({ data: [data] });
  psbt.addOutput({ script: embed.output, value: 0 });
}

// Create and sign Taproot transaction
async function createTaprootTransaction(taprootData, recipient, satoshis) {
  try {
    const psbt = new bitcoin.Psbt({ network });

    // Use valid transaction ID (example ID here)
    const txid = Buffer.from('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'hex');

    // Add input
    psbt.addInput({
      hash: txid,
      index: 0,
      witnessUtxo: {
        value: satoshis,
        script: taprootData.output,
      },
      tapInternalKey: taprootData.signer.publicKey,
    });

    // Add output
    psbt.addOutput({
      address: recipient,
      value: satoshis - 1000 // Subtract fee
    });

    // Add OP_RETURN output
    addOpReturnOutput(psbt, "Created with Bitcoin Taproot Demo");

    // Sign transaction with Schnorr signer
    await psbt.signInput(0, taprootData.signer);
    
    // Finalize transaction
    psbt.finalizeAllInputs();

    // Extract transaction
    return psbt.extractTransaction().toHex();
  } catch (error) {
    console.error('Error in createTaprootTransaction:', error);
    throw error;
  }
}

// Print debug information
function printDebugInfo(data) {
  console.log('\nDebug Information:');
  for (const [key, value] of Object.entries(data)) {
    if (Buffer.isBuffer(value)) {
      console.log(`${key}: ${value.toString('hex')} (Buffer)`);
    } else if (typeof value === 'object' && value !== null) {
      console.log(`${key}: [Object]`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
}

async function main() {
  try {
    // Create Taproot address
    const taprootData = await createTaprootAddress();
    
    console.log('Taproot Details:');
    console.log('Taproot Address:', taprootData.address);
    console.log('Public Key:', taprootData.signer.publicKey.toString('hex'));
    console.log('Output Script:', taprootData.output.toString('hex'));

    // Output debug information
    printDebugInfo({
      network: network.messagePrefix,
      publicKeyType: taprootData.signer.publicKey.constructor.name,
      publicKeyLength: taprootData.signer.publicKey.length,
      hasPrivateKey: !!taprootData.signer.keyPair.privateKey,
      outputType: taprootData.output.constructor.name,
      outputLength: taprootData.output.length
    });

    // Create transaction
    const recipientAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
    const tx = await createTaprootTransaction(taprootData, recipientAddress, 100000);
    
    // Parse and print transaction details
    const decodedTx = bitcoin.Transaction.fromHex(tx);
    console.log('\nTransaction Details:');
    console.log('Version:', decodedTx.version);
    console.log('Inputs:', decodedTx.ins.length);
    console.log('Outputs:', decodedTx.outs.length);
    console.log('Transaction Hex:', tx);

    // Print signature information
    console.log('\nSignature Details:');
    decodedTx.ins.forEach((input, index) => {
      console.log(`Input #${index} Witness:`, input.witness.map(w => w.toString('hex')));
    });
  } catch (error) {
    console.error('Main Error:', error);
  }
}

main().catch(console.error);
