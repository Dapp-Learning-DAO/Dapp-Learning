const { expect } = require("chai");
const { exec } = require('child_process');


describe("ERC721 contract", function() {
    it("Deployment should not assign any Token to deployer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        console.log(owner.address)
        console.log(addr1.address)

        const contractfactory = await ethers.getContractFactory("MYERC721");
        const myerc721 = await contractfactory.deploy("MYERC721", "TEST","");

        console.log(myerc721.address);

        const ownerBalance = await myerc721.balanceOf(owner.address);
        expect("0").to.equal(ownerBalance);
    });

});