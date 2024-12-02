import ecpair from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import bitcoin from 'bitcoinjs-lib';

/// In this example, We create a new private key and its corresponding public key.
/// We then construct a transaction with one input (which you're spending) and one output (where you're sending bitcoins).
/// The transaction is signed using the private key.
/// Finally, we build the transaction and print its hexadecimal representation.

const { ECPairFactory } = ecpair;
const ECPair = ECPairFactory(tinysecp);

// Securely generate and store the private key. Here, we use a randomly generated private key for demonstration.
const keyPair = ECPair.makeRandom();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
const privateKey = keyPair.privateKey.toString('hex');

console.log(`Address: ${address}`);
console.log(`Private Key: ${privateKey}`);

// Replace the following with a real transaction hash and the corresponding index of the output you want to spend.
const txHash = Buffer.from('c8c5b5a17a07c7cecdbdece070843fb074ae039400a26c27861927dab26631b5', 'hex'); // This should be a real transaction hash
const txId = 1; // Typically 0 or 1

// Create a new transaction builder
const transaction = new bitcoin.Transaction();

// Add the input (the transaction hash and index)
transaction.addInput(txHash, txId);

// Add the output (recipient address and amount in satoshis)
transaction.addOutput(Buffer.alloc(0), 10000); // The amount you want to send, in satoshis

// Sign the transaction with the private key of the input
const hash = transaction.hashForSignature(0, Buffer.from('001494fea8dd42d30e583fdf39537fb7e2ee0533e6b7', 'hex'), 0);
const signature = keyPair.sign(hash);
transaction.setInputScript(0, bitcoin.script.compile([signature, keyPair.publicKey]));

// Build the transaction and get its hex representation
const tx = transaction.toHex();

console.log(`Transaction: ${tx}`);
