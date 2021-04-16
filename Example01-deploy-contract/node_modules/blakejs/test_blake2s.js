var test = require('tape')
var toHex = require('./util').toHex
var util = require('./util')
var b2s = require('./blake2s')
var blake2s = b2s.blake2s
var blake2sHex = b2s.blake2sHex
var blake2sInit = b2s.blake2sInit
var blake2sUpdate = b2s.blake2sUpdate
var blake2sFinal = b2s.blake2sFinal

test('BLAKE2s basic', function (t) {
  // From the example computation in the RFC
  t.equal(blake2sHex('abc'),
    '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982')
  t.equal(blake2sHex(new Uint8Array([97, 98, 99])),
    '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982')
  t.equal(blake2sHex(Buffer.from([97, 98, 99])),
    '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982')
  t.end()
})

test('BLAKE2s self test', function (t) {
  // Grand hash of hash results
  var expectedHash = [
    0x6A, 0x41, 0x1F, 0x08, 0xCE, 0x25, 0xAD, 0xCD,
    0xFB, 0x02, 0xAB, 0xA6, 0x41, 0x45, 0x1C, 0xEC,
    0x53, 0xC5, 0x98, 0xB2, 0x4F, 0x4F, 0xC7, 0x87,
    0xFB, 0xDC, 0x88, 0x79, 0x7F, 0x4C, 0x1D, 0xFE]

  // Parameter sets
  var outputLengths = [16, 20, 28, 32]
  var inputLengths = [0, 3, 64, 65, 255, 1024]

  // 256-bit hash for testing
  var ctx = blake2sInit(32)

  for (var i = 0; i < 4; i++) {
    var outlen = outputLengths[i]
    for (var j = 0; j < 6; j++) {
      var inlen = inputLengths[j]

      var arr = generateInput(inlen, inlen)
      var hash = blake2s(arr, null, outlen) // unkeyed hash
      blake2sUpdate(ctx, hash) // hash the hash

      var key = generateInput(outlen, outlen)
      hash = blake2s(arr, key, outlen) // keyed hash
      blake2sUpdate(ctx, hash) // hash the hash
    }
  }

  // Compute and compare the hash of hashes
  var finalHash = blake2sFinal(ctx)
  t.equal(toHex(finalHash), toHex(expectedHash))
  t.end()
})

// Returns a Uint8Array of len bytes
function generateInput (len, seed) {
  var out = new Uint8Array(len)
  var a = new Uint32Array(3)
  a[0] = 0xDEAD4BAD * seed // prime
  a[1] = 1
  for (var i = 0; i < len; i++) { // fill the buf
    a[2] = a[0] + a[1]
    a[0] = a[1]
    a[1] = a[2]
    out[i] = (a[2] >>> 24) & 0xFF
  }
  return out
}

test('BLAKE2s performance', function (t) {
  var N = 1 << 22 // number of bytes to hash
  var RUNS = 3 // how often to repeat, to allow JIT to finish

  console.log('Benchmarking BLAKE2s(' + (N >> 20) + ' MB input)')
  util.testSpeed(blake2sHex, N, RUNS)
  t.end()
})
