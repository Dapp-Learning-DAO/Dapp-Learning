const { expect } = require("chai");

describe("Verifier Contract",function(){
  it('test function of recoverSigner', async function () {
    const [Alice] = await ethers.getSigners()
    console.log('Owner address is :', Alice.address)

    // Deploy Verify sol
    const verifyContractFactory = await ethers.getContractFactory('Verifier')
    const verifyContract = await await verifyContractFactory.deploy()
    await verifyContract.deployed()

    console.log('Verifier Contract address: ', verifyContract.address)

    let messageHash = ethers.utils.id('Hello World')
    let messageHashBytes = ethers.utils.arrayify(messageHash)

    // Sign the binary data
    let flatSig = await Alice.signMessage(messageHashBytes)

    // For Solidity, we need the expanded-format of a signature
    let sig = ethers.utils.splitSignature(flatSig)

    // Call the verifyString function
    let recovered = await verifyContract.recoverSigner(messageHash, flatSig)

    expect(recovered).to.equal(Alice.address)
  })
});
