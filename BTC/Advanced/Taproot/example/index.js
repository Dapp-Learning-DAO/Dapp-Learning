const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const secp256k1 = require('@bitcoinerlab/secp256k1');
const ECPair = ECPairFactory(secp256k1);

// Initialize the elliptic curve library for Bitcoin operations
bitcoin.initEccLib(secp256k1);

// Set network to testnet for development purposes
const network = bitcoin.networks.testnet;

/**
 * Convert a public key to x-only format required for Taproot
 * @param {Buffer} pubKey - The full public key
 * @returns {Buffer} The x-only public key (32 bytes)
 */
function toXOnly(pubKey) {
  return Buffer.from(pubKey).slice(1, 33);
}

/**
 * SchnorrSigner class for handling Taproot signatures
 * Implements the Schnorr signature scheme required for Taproot
 */
class SchnorrSigner {
  constructor(keyPair) {
    this.keyPair = keyPair;
    // Convert to x-only public key format required for Taproot
    this.publicKey = toXOnly(keyPair.publicKey);
  }

  // Sign transaction with Schnorr signature
  sign(hash) {
    return this.keyPair.sign(hash, true); // Enable Schnorr signing
  }

  signSchnorr(hash) {
    return this.sign(hash);
  }
}

/**
 * Creates a Taproot address and associated data
 * @returns {Object} Contains signer, address and output script
 */
function createTaprootAddress() {
  // Generate random keypair for Taproot
  const keyPair = ECPair.makeRandom({ network });
  const schnorrSigner = new SchnorrSigner(keyPair);
  
  // Create P2TR (Pay-to-Taproot) payment object
  const { address, output } = bitcoin.payments.p2tr({
    pubkey: schnorrSigner.publicKey,
    network,
  });

  return { signer: schnorrSigner, address, output };
}

/**
 * Adds OP_RETURN output to transaction
 * @param {Psbt} psbt - The Partially Signed Bitcoin Transaction
 * @param {string} message - Message to embed in OP_RETURN
 */
function addOpReturnOutput(psbt, message) {
  const data = Buffer.from(message, 'utf8');
  const embed = bitcoin.payments.embed({ data: [data] });
  psbt.addOutput({ script: embed.output, value: 0 });
}

/**
 * Creates and signs a Taproot transaction
 * @param {Object} taprootData - Contains signer and output information
 * @param {string} recipient - Recipient's address
 * @param {number} satoshis - Amount to send
 * @param {string} message - Optional OP_RETURN message
 * @returns {string} Signed transaction in hex format
 */
async function createTaprootTransaction(taprootData, recipient, satoshis, message = "Created with Bitcoin Taproot Demo") {
  try {
    // Initialize PSBT (Partially Signed Bitcoin Transaction)
    const psbt = new bitcoin.Psbt({ network });

    // Example transaction ID (replace with actual UTXO in production)
    const txid = Buffer.from('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'hex');

    // Add input with Taproot specific fields
    psbt.addInput({
      hash: txid,
      index: 0,
      witnessUtxo: {
        value: satoshis,
        script: taprootData.output,
      },
      tapInternalKey: taprootData.signer.publicKey,
    });

    // Add recipient output (with fee deduction)
    psbt.addOutput({
      address: recipient,
      value: satoshis - 1000 // Deduct transaction fee
    });

    // Add optional OP_RETURN message
    addOpReturnOutput(psbt, message);

    // Sign and finalize the transaction
    await psbt.signInput(0, taprootData.signer);
    psbt.finalizeAllInputs();

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
    const taprootData = createTaprootAddress();
    
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
