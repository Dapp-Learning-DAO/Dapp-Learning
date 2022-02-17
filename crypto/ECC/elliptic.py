"""
By Willem Hengeveld <itsme@xs4all.nl>
ecdsa implementation in python
demonstrating several 'unconventional' calculations,
like finding a public key from a signature,
and finding a private key from 2 signatures with identical 'r'
"""


def GCD(a, b):
    """
    (gcd,c,d)= GCD(a, b)  ===> a*c+b*d!=gcd:
    """
    if a == 0:
        return (b, 0, 1)
    d1, x1, y1 = GCD(b % a, a)
    return (d1, y1 - (b // a) * x1, x1)


def modinv(x, m):
    (gcd, c, d) = GCD(x, m)
    return c


def samefield(a, b):
    """
    determine if a uses the same field
    """
    if a.field != b.field:
        raise RuntimeError("field mismatch")
    return True


class FiniteField:
    """
    FiniteField implements a value modulus a number.
    """

    class Value:
        """
        represent a value in the FiniteField
        this class forwards all operations to the FiniteField class
        """

        def __init__(self, field, value):
            self.field = field
            self.value = field.integer(value)

        # Value * int
        def __add__(self, rhs):
            return self.field.add(self, self.field.value(rhs))

        def __sub__(self, rhs):
            return self.field.sub(self, self.field.value(rhs))

        def __mul__(self, rhs):
            return self.field.mul(self, self.field.value(rhs))

        def __truediv__(self, rhs):
            return self.field.div(self, self.field.value(rhs))

        def __pow__(self, rhs):
            return self.field.pow(self, rhs)

        # int * Value
        def __radd__(self, rhs):
            return self.field.add(self.field.value(rhs), self)

        def __rsub__(self, rhs):
            return self.field.sub(self.field.value(rhs), self)

        def __rmul__(self, rhs):
            return self.field.mul(self.field.value(rhs), self)

        def __rtruediv__(self, rhs):
            return self.field.div(self.field.value(rhs), self)

        def __rpow__(self, rhs):
            return self.field.pow(self.field.value(rhs), self)

        def __eq__(self, rhs):
            return self.field.eq(self, self.field.value(rhs))

        def __ne__(self, rhs):
            return not (self == rhs)

        def __neg__(self):
            return self.field.neg(self)

        def sqrt(self, flag):
            return self.field.sqrt(self, flag)

        def inverse(self):
            return self.field.inverse(self)

        def iszero(self):
            return self.value == 0

        def __repr__(self):
            return "%d (mod %d)" % (self.value, self.field.p)

        def __str__(self):
            return "%d (mod %d)" % (self.value, self.field.p)

    def __init__(self, p, order=1):
        self.p = p ** order

    """
    several basic operators
    """

    def add(self, lhs, rhs):
        return samefield(lhs, rhs) and self.value((lhs.value + rhs.value) % self.p)

    def sub(self, lhs, rhs):
        return samefield(lhs, rhs) and self.value((lhs.value - rhs.value) % self.p)

    def mul(self, lhs, rhs):
        return samefield(lhs, rhs) and self.value((lhs.value * rhs.value) % self.p)

    def div(self, lhs, rhs):
        return samefield(lhs, rhs) and self.value((lhs.value * rhs.inverse()) % self.p)

    def pow(self, lhs, rhs):
        return self.value(pow(lhs.value, self.integer(rhs), self.p))

    def eq(self, lhs, rhs):
        return (lhs.value - rhs.value) % self.p == 0

    def neg(self, val):
        return self.value(self.p - val.value)

    def sqrt(self, val, flag):
        """
        calculate the square root modulus p
        """
        if val.iszero():
            return val
        sw = self.p % 8
        if sw == 3 or sw == 7:
            res = val ** ((self.p + 1) / 4)
        elif sw == 5:
            x = val ** ((self.p + 1) / 4)
            if x == 1:
                res = val ** ((self.p + 3) / 8)
            else:
                res = (4 * val) ** ((self.p - 5) / 8) * 2 * val
        else:
            raise Exception("modsqrt non supported for (p%8)==1")
        if res.value % 2 == flag:
            return res
        else:
            return -res

    def inverse(self, value):
        """
        calculate the multiplicative inverse
        """
        return modinv(value.value, self.p)

    def value(self, x):
        """
        converts an integer or FinitField.Value to a value of this FiniteField.
        """
        return (
            x
            if isinstance(x, FiniteField.Value) and x.field == self
            else FiniteField.Value(self, x)
        )

    def integer(self, x):
        """
        returns a plain integer
        """
        return x.value if isinstance(x, FiniteField.Value) else x

    def zero(self):
        """
        returns the additive identity value
        meaning:  a + 0 = a
        """
        return FiniteField.Value(self, 0)

    def one(self):
        """
        returns the multiplicative identity value
        meaning a * 1 = a
        """
        return FiniteField.Value(self, 1)


class EllipticCurve:
    """
    EllipticCurve implements a point on a elliptic curve
    """

    class Point:
        """
        represent a value in the EllipticCurve
        this class forwards all operations to the EllipticCurve class
        """

        def __init__(self, curve, x, y):
            self.curve = curve
            self.x = x
            self.y = y

        # Point + Point
        def __add__(self, rhs):
            return self.curve.add(self, rhs)

        def __sub__(self, rhs):
            return self.curve.sub(self, rhs)

        # Point * int   or Point * Value
        def __mul__(self, rhs):
            return self.curve.mul(self, rhs)

        def __div__(self, rhs):
            return self.curve.div(self, rhs)

        def __eq__(self, rhs):
            return self.curve.eq(self, rhs)

        def __ne__(self, rhs):
            return not (self == rhs)

        def __str__(self):
            return "(%s,%s)" % (self.x, self.y)

        def __neg__(self):
            return self.curve.neg(self)

        def iszero(self):
            return self.x.iszero() and self.y.iszero()

        def isoncurve(self):
            return self.curve.isoncurve(self)

    def __init__(self, field, a, b):
        self.field = field
        self.a = field.value(a)
        self.b = field.value(b)

    def add(self, p, q):
        """
        perform elliptic curve addition
        """
        if p.iszero():
            return q
        if q.iszero():
            return p

        # calculate the slope of the intersection line
        if p == q:
            if p.y == 0:
                return self.zero()
            l = (3 * p.x ** 2 + self.a) / (2 * p.y)
        elif p.x == q.x:
            return self.zero()
        else:
            l = (p.y - q.y) / (p.x - q.x)

        # calculate the intersection point
        x = l ** 2 - (p.x + q.x)
        y = l * (p.x - x) - p.y
        return self.point(x, y)

    # subtraction is :  a - b  =  a + -b
    def sub(self, lhs, rhs):
        return lhs + -rhs

    # scalar multiplication is implemented like repeated addition
    def mul(self, pt, scalar):
        scalar = self.field.integer(scalar)
        accumulator = self.zero()
        shifter = pt
        while scalar != 0:
            bit = scalar % 2
            if bit:
                accumulator += shifter
            shifter += shifter
            scalar //= 2

        return accumulator

    def div(self, pt, scalar):
        """
        scalar division:  P / a = P * (1/a)
        scalar is assumed to be of type FiniteField(grouporder)
        """
        return pt * (1 // scalar)

    def eq(self, lhs, rhs):
        return lhs.x == rhs.x and lhs.y == rhs.y

    def neg(self, pt):
        return self.point(pt.x, -pt.y)

    def zero(self):
        """
        Return the additive identity point ( aka '0' )
        P + 0 = P
        """
        return self.point(self.field.zero(), self.field.zero())

    def point(self, x, y):
        """
        construct a point from 2 values
        """
        return EllipticCurve.Point(self, self.field.value(x), self.field.value(y))

    def isoncurve(self, p):
        """
        verifies if a point is on the curve
        """
        return p.iszero() or p.y ** 2 == p.x ** 3 + self.a * p.x + self.b

    def decompress(self, x, flag):
        """
        calculate the y coordinate given only the x value.
        there are 2 possible solutions, use 'flag' to select.
        """
        x = self.field.value(x)
        ysquare = x ** 3 + self.a * x + self.b

        return self.point(x, ysquare.sqrt(flag))


class ECDSA:
    """
    Digital Signature Algorithm using Elliptic Curves
    """

    def __init__(self, ec, G, n):
        self.ec = ec
        self.G = G
        self.GFn = FiniteField(n)

    def calcpub(self, privkey):
        """
        calculate the public key for private key x
        return G*x
        """
        return self.G * self.GFn.value(privkey)

    def sign(self, message, privkey, secret):
        """
        sign the message using private key and sign secret
        for signsecret k, message m, privatekey x
        return (G*k,  (m+x*r)/k)
        """
        m = self.GFn.value(message)
        x = self.GFn.value(privkey)
        k = self.GFn.value(secret)

        R = self.G * k

        r = self.GFn.value(R.x)
        s = (m + x * r) / k

        print("=== Signature Generated Successfully ===")

        return (r, s)

    def verify(self, message, pubkey, rnum, snum):
        """
        Verify the signature
        for message m, pubkey Y, signature (r,s)
        r = xcoord(R)
        verify that :  G*m+Y*r=R*s
        this is true because: { Y=G*x, and R=G*k, s=(m+x*r)/k }

        G*m+G*x*r = G*k*(m+x*r)/k  ->
        G*(m+x*r) = G*(m+x*r)
        several ways to do the verification:
            r == xcoord[ G*(m/s) + Y*(r/s) ]  <<< the standard way
            R * s == G*m + Y*r
            r == xcoord[ (G*m + Y*r)/s) ]

        """
        m = self.GFn.value(message)
        r = self.GFn.value(rnum)
        s = self.GFn.value(snum)

        R = self.G * (m / s) + pubkey * (r / s)

        # alternative methods of verifying
        # RORG= self.ec.decompress(r, 0)
        # RR = self.G * m + pubkey * r
        # print "#1: %s .. %s"  % (RR, RORG*s)
        # print "#2: %s .. %s"  % (RR*(1/s), r)
        # print "#3: %s .. %s"  % (R, r)
        if R.x == r:
            print("=== Signature is Valid ===")

        return R.x == r

    def crack2(self, r, s1, s2, m1, m2):
        """
        find signsecret and privkey from duplicate 'r'
        signature (r,s1) for message m1
        and signature (r,s2) for message m2
        s1= (m1 + x*r)/k
        s2= (m2 + x*r)/k
        subtract -> (s1-s2) = (m1-m2)/k  ->  k = (m1-m2)/(s1-s2)
        -> privkey =  (s1*k-m1)/r  .. or  (s2*k-m2)/r
        """
        sdelta = self.GFn.value(s1 - s2)
        mdelta = self.GFn.value(m1 - m2)

        secret = mdelta / sdelta
        x1 = self.crack1(r, s1, m1, secret)
        x2 = self.crack1(r, s2, m2, secret)

        if x1 != x2:
            print("x1=%s" % x1)
            print("x2=%s" % x2)

        return (secret, x1)

    def crack1(self, rnum, snum, message, signsecret):
        """
        find privkey, given signsecret k, message m, signature (r,s)
        x= (s*k-m)/r
        """
        m = self.GFn.value(message)
        r = self.GFn.value(rnum)
        s = self.GFn.value(snum)
        k = self.GFn.value(signsecret)
        return (s * k - m) / r


def secp256k1():
    """
    create the secp256k1 curve
    """
    GFp = FiniteField(2 ** 256 - 2 ** 32 - 977)
    ec = EllipticCurve(GFp, 0, 7)
    return ECDSA(
        ec,
        ec.point(
            0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
            0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8,
        ),
        2 ** 256 - 432420386565659656852420866394968145599,
    )


def verifytest(calced, expected, descr):
    """
    verifytest is used to verify test results
    """
    if type(calced) != type(expected):
        if type(expected) == str:
            calced = "%s" % calced
    if calced != expected:
        print("ERROR in %s: got %s, expected %s" % (descr, calced, expected))
    else:
        return True


def test_dsa():
    dsa = secp256k1()

    priv = 0x12345
    pubkey = dsa.calcpub(priv)
    signsecret1 = 0x1111
    signsecret2 = 0x2222

    msg1 = 0x1234123412341234123412341234123412341234123412341234123412341234
    (r1, s1) = dsa.sign(msg1, priv, signsecret1)
    check1 = dsa.verify(msg1, pubkey, r1, s1)

    msg2 = 0x1111111111111111111111111111111111111111111111111111111111111111
    (r2, s2) = dsa.sign(msg2, priv, signsecret1)
    check2 = dsa.verify(msg2, pubkey, r2, s2)

    (crackedsecret, crackedprivkey) = dsa.crack2(r1, s1, s2, msg1, msg2)
    if verifytest(crackedprivkey, priv, "crackedpriv"):
        print("=== Cracked!!! ===\nThe Private Key is ", crackedprivkey.value)


def test_ff():
    ff = FiniteField(17)
    assert ff.value(5) + ff.value(15) == ff.value(3)
    assert ff.value(5) * ff.value(15) / ff.value(15) == ff.value(5)
    print("test_ff() passed")


def test_curve():
    dsa = secp256k1()
    G2 = dsa.G * 2
    assert G2 == dsa.G + dsa.G
    assert G2.x == 0xC6047F9441ED7D6D3045406E95C07CD85C778E4B8CEF3CA7ABAC09B95C709EE5
    assert G2.y == 0x1AE168FEA63DC339A3C58419466CEAEEF7F632653266D0E1236431A950CFE52A
    G20 = dsa.G * 20
    assert G20.x == 0x4CE119C96E2FA357200B559B2F7DD5A5F02D5290AFF74B03F3E471B273211C97
    assert G20.y == 0x12BA26DCB10EC1625DA61FA10A844C676162948271D96967450288EE9233DC3A
    Gx = dsa.G * 112233445566778899
    assert Gx.x == 0xA90CC3D3F3E146DAADFC74CA1372207CB4B725AE708CEF713A98EDD73D99EF29
    assert Gx.y == 0x5A79D6B289610C68BC3B47F3D72F9788A26A06868B4D8E433E1E2AD76FB7DC76
    print("test_curve() passed")


if __name__ == "__main__":
    test_ff()
    test_curve()
    test_dsa()
