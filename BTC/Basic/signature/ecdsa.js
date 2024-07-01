import ecpair from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import crypto from 'crypto';

/// In this example, we first generate a new private key and corresponding public key.
/// We then create a simulated transaction hash (in a real application, this would be the actual hash of the transaction) and use the private key to sign this hash.
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
const signature = keyPair.sign(txHash);
console.log('signature:', signature.toString('hex'));

// verify transaction
const isValid = keyPair.verify(txHash, signature);
console.log('signature is valid:', isValid);
