const { bufferToHex, keccak256 } = require( 'ethereumjs-util');


 const  MerkleTree = () => {
    let elements;
    let bufferElementPositionIndex
    let layers

  function merkleTree(elements) {
    elements = [...elements]
    // Sort elements
    elements.sort(Buffer.compare)
    // Deduplicate elements
    elements = MerkleTree.bufDedup(this.elements)

    bufferElementPositionIndex = this.elements.reduce((memo, el, index) => {
      memo[bufferToHex(el)] = index
      return memo
    }, {})

    // Create layers
    this.layers = getLayers(this.elements)
  }

  function getLayers(elements) {
    if (elements.length === 0) {
      throw new Error('empty tree')
    }

    const layers = []
    layers.push(elements)

    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]))
    }

    return layers
  }

  function getNextLayer(elements ) {
    return elements.reduce((layer, el, idx, arr) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(MerkleTree.combinedHash(el, arr[idx + 1]))
      }

      return layer
    }, [])
  }

  const combinedHash = (first, second) => {
    if (!first) {
      return second
    }
    if (!second) {
      return first
    }

    return keccak256(MerkleTree.sortAndConcat(first, second))
  }

  function  getRoot() {
    return this.layers[this.layers.length - 1][0]
  }

  function getHexRoot() {
    return bufferToHex(this.getRoot())
  }

  function getProof(el) {
    let idx = this.bufferElementPositionIndex[bufferToHex(el)]

    if (typeof idx !== 'number') {
      throw new Error('Element does not exist in Merkle tree')
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = MerkleTree.getPairElement(idx, layer)

      if (pairElement) {
        proof.push(pairElement)
      }

      idx = Math.floor(idx / 2)

      return proof
    }, [])
  }

  function getHexProof(el) {
    const proof = this.getProof(el)

    return MerkleTree.bufArrToHexArr(proof)
  }

  function getPairElement(idx, layer)  {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1

    if (pairIdx < layer.length) {
      return layer[pairIdx]
    } else {
      return null
    }
  }

  function bufDedup(elements) {
    return elements.filter((el, idx) => {
      return idx === 0 || !elements[idx - 1].equals(el)
    })
  }

  function bufArrToHexArr(arr) {
    if (arr.some((el) => !Buffer.isBuffer(el))) {
      throw new Error('Array is not an array of buffers')
    }

    return arr.map((el) => '0x' + el.toString('hex'))
  }

  function sortAndConcat(...args) {
    return Buffer.concat([...args].sort(Buffer.compare))
  }
}
module.exports =  MerkleTree;