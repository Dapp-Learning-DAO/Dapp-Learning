import ecpair from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import crypto from 'crypto';

/// In this example, we first generate a new private key and corresponding public key.
/// We create a dummy transaction hash. In a real scenario, this would be the hash of your transaction data.
/// We generate a Schnorr signature using the private key and the transaction hash.
/// Finally, we verify that the signature is valid.

const { ECPairFactory } = ecpair;
const ECPair = ECPairFactory(tinysecp);

// Generate a new random private key
const keyPair = ECPair.makeRandom();
const privateKey = keyPair.privateKey;
const publicKey = keyPair.publicKey;

console.log('private key:', privateKey.toString('hex'));
console.log('public key:', publicKey.toString('hex'));

// Create a hypothetical transaction hash, usually this will be the hash of the real transaction you want to sign
const txHash = crypto.randomBytes(32);

// signature transaction
const signature = keyPair.signSchnorr(txHash);
console.log('Schnorr Signature:', signature.toString('hex'));

// verify transaction
const isValid = keyPair.verifySchnorr(txHash, signature);
console.log('signature is valid:', isValid);
