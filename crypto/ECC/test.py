import unittest
from binascii import hexlify, unhexlify
from fastecdsa import keys, curve
from fastecdsa.encoding.sec1 import InvalidSEC1PublicKey, SEC1Encoder
from ecc_secp256k1 import ECC256k1

PRIV_KEY = 0x92c0302c1fff4679f4c98684ff368fdbe04da815e6de24d246793f5812577016

pub_key = keys.get_public_key(PRIV_KEY, curve.secp256k1)
uncompressed_pubkey = (hexlify(SEC1Encoder.encode_public_key(pub_key, compressed=False))).decode()
compressed_pubkey = (hexlify(SEC1Encoder.encode_public_key(pub_key))).decode()

print("私钥:", PRIV_KEY)
print("公钥:" , pub_key)
print("未压缩公钥:", uncompressed_pubkey)
print("压缩公钥:", compressed_pubkey)

ecc = ECC256k1()
publicKey = ecc.publicKey(PRIV_KEY)
uncompressedPubkey = ecc.uncompressedPubkey(publicKey)
compressedPubkey = ecc.compressedPubkey(publicKey)

class TestEccSecp256k1(unittest.TestCase):

    def test_uncompressed_pubkey(self):
        self.assertEqual(uncompressedPubkey, uncompressed_pubkey, "未压缩公钥不相等")

    def test_compressed_pubkey(self):
        self.assertEqual(compressedPubkey, compressed_pubkey, "压缩公钥不相等")

if __name__ == '__main__':
    unittest.main()

# https://github.com/AntonKueltz/fastecdsa
