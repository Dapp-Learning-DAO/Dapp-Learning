#coding:utf-8

#!/usr/bin/env python

import sys

if sys.version_info < (3,0):
    print("Please use python3 version to run the code")
    print("请使用 python3 运行代码")
    sys.exit()

# Super simple Elliptic Curve Presentation. No imported libraries, wrappers, nothing.
# For educational purposes only.

# Below are the public specs for Bitcoin's curve - the secp256k1

Pcurve = 2**256 - 2**32 - 2**9 - 2**8 - 2**7 - 2**6 - 2**4 -1 # Finite field, 有限域
# 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f

N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 # 群的阶
Acurve = 0; Bcurve = 7 # 椭圆曲线的参数式. y^2 = x^3 + Acurve * x + Bcurve

Gx = 55066263022277343669578718895168534326250603453777594175500187360389116729240
# 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798

Gy = 32670510020758816978083085130507043184471273380659243275938904335757337482424
# 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8

GPoint = (Gx, Gy) # 椭圆曲线生成点, Base point.

#(Gx**3+7) % Pcurve == (Gy**2) % Pcurve, GPoint在椭圆曲线上, x/y坐标符合椭圆曲线方程

h = 1 # Subgroup cofactor, 子群辅因子为1, 就不参与运算了

# Pcurve, N, GPoint, secp256k1的函数式, 都是严格规定的, 严禁修改 !!!

class ECC256k1:

    # 扩展欧几里得算法, https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm
    # Extended Euclidean Algorithm/'division' in elliptic curves
    def inverse_mod(self, a, n=Pcurve):
        lm, hm = 1, 0
        low, high = a % n, n
        while low > 1:
            ratio = high //low
            nm, new = hm - lm * ratio, high - low * ratio
            lm, low, hm, high = nm, new, lm, low
        return lm % n

    def ECadd(self, a, b): # 椭圆曲线加法
        LamAdd = ((b[1] - a[1]) * self.inverse_mod(b[0] - a[0], Pcurve)) % Pcurve

        x = (LamAdd * LamAdd - a[0] - b[0]) % Pcurve
        y = (LamAdd * (a[0] - x) - a[1]) % Pcurve
        return (x,y)

    def ECdouble(self, a): # 椭圆曲线倍乘
        Lam = ((3 * a[0] * a[0] + Acurve) * self.inverse_mod((2 * a[1]), Pcurve)) % Pcurve

        x = (Lam * Lam - 2 * a[0]) % Pcurve
        y = (Lam * (a[0] - x) - a[1]) % Pcurve

        return (x,y)

    def EccMultiply(self, GenPoint, ScalarHex): # Double & Add. Not true multiplication
        if ScalarHex == 0 or ScalarHex >= N: raise Exception("Invalid Scalar/Private Key")

        ScalarBin = str(bin(ScalarHex))[2:]

        Q = GenPoint
        for i in range (1, len(ScalarBin)): # EC乘法转为标量乘法进行计算 减少运算量
            Q = self.ECdouble(Q)

            if ScalarBin[i] == "1":
                Q = self.ECadd(Q, GenPoint); # print "ADD", Q[0]; print

        return (Q)

    def publicKey(self, privKey):
        return self.EccMultiply(GPoint, privKey)

    def compressedPubkey(self, pubKey):
        fill = str(hex(pubKey[0])[2:]).zfill(64)
        if pubKey[1] % 2 == 1: # If the Y value for the Public Key is odd.
            return ("03" + fill)
        else: # Or else, if the Y value is even.
            return ("02" + fill)

    def uncompressedPubkey(self, pubKey):
        return ("04" + "%064x" % pubKey[0] + "%064x" % pubKey[1])


def main():
    priv_key = 0x1111111111111111111111111111111111111111111111111111111111111111

    ecc = ECC256k1()

    PublicKey = ecc.publicKey(priv_key)
    print("私钥:")
    print(priv_key)

    print("未压缩公钥 (坐标):")
    print(PublicKey)

    print("未压缩公钥 (十六进制):")
    print(ecc.uncompressedPubkey(PublicKey))

    print("压缩公钥:")
    print(ecc.compressedPubkey(PublicKey))

if __name__ == "__main__":
    main()
