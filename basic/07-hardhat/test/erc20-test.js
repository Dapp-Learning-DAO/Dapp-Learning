const { expect } = require("chai");

describe("Token contract", function() {
  it("Deployment should assign the total supply of tokens to the owner", async function() {
    const [owner] = await ethers.getSigners();
    console.log(owner.address)
    const Token = await ethers.getContractFactory("SimpleToken");

    const hardhatToken = await Token.deploy("HEHE", "HH", 1, 100000000);

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    console.log(owner.address)
    console.log(addr1.address)
    console.log(addr2.address)
    const Token = await ethers.getContractFactory("SimpleToken");

    const hardhatToken = await Token.deploy("HEHE", "HH", 1, 100000000);

    // Transfer 50 tokens from owner to addr1
    await hardhatToken.transfer(addr1.address, 50);
    expect(await hardhatToken.balanceOf(addr1.address)).to.equal(50);

    // Transfer 50 tokens from addr1 to addr2
    await hardhatToken.connect(addr1).transfer(addr2.address, 50);
    expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);
  });
});
