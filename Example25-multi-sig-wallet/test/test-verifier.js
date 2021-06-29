const { expect } = require("chai");

describe("Verifier Contract",function(){
  it("test function of verifyString",async function(){
    const [Alice] = await ethers.getSigners();
    console.log("Owner address is :",Alice.address);

    // Deploy Verify sol
    const verifyContractFactory = await ethers.getContractFactory("Verifier");
    const verifyContract = await await verifyContractFactory.deploy();
    await verifyContract.deployed();

    console.log("Verifier Contract address: ", verifyContract.address)
    
    let message = 'Hello World'

    // Sign the string message
    let flatSig = await Alice.signMessage(message)

    // For Solidity, we need the expanded-format of a signature
    let sig = ethers.utils.splitSignature(flatSig)

    // Call the verifyString function
    let recovered = await verifyContract.verifyString(message, sig.v, sig.r, sig.s)
   
    expect(recovered).to.equal(Alice.address)
    
  });
});
