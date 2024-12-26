import ecpair from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import bitcoin from 'bitcoinjs-lib';

const { ECPairFactory } = ecpair;
const ECPair = ECPairFactory(tinysecp);
bitcoin.initEccLib(tinysecp);

function toXOnly(pubKey) {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
}

function generateAddress(networkType, addressType) {
  const network = bitcoin.networks[networkType];
  // 生成Bitcoin私钥和地址
  const keyPair = ECPair.makeRandom({ network });

  let address;
  switch (addressType) {
    case 'legacy':
      address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address;
      break;
    case 'nestedSegwit':
      address = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }),
        network,
      }).address;
      break;
    case 'nativeSegwit':
      address = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address;
      break;
    case 'taproot':
      const pubkey = toXOnly(keyPair.publicKey);
      address = bitcoin.payments.p2tr({ pubkey, network }).address;
      break;
    default:
      address = 'Invalid address type';
  }
  return address;
}

console.log('Legacy Address:', generateAddress('bitcoin', 'legacy'));
console.log('Nested Segwit Address:', generateAddress('bitcoin', 'nestedSegwit'));
console.log('Native Segwit Address:', generateAddress('bitcoin', 'nativeSegwit'));
console.log('Taproot Address:', generateAddress('bitcoin', 'taproot'));
