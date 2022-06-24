const {expect} = require('chai');
const {ethers, network, waffle} = require('hardhat');

require('@nomiclabs/hardhat-waffle')
const provider = waffle.provider;

describe("Replay mint on NBA", function() {
    it("1. replay attack success", async function(){
        const [owner, alice, bob] = await ethers.getSigners();
       //1. Deploy NBA
        const NBA = await ethers.getContractFactory("BuggyNBA", owner);
        const nba = await NBA.deploy();
        await nba.deployed();
        console.log("nba contract deployed to ", nba.address);

       //2. Set Alice as whitelist user
        await (await nba.connect(owner).setWhitelist([alice.address])).wait();
        console.log("alice ", alice.address, " already whitelisted");
       //3. Alice create his proof and mint tokens
        var message = ethers.utils.hexZeroPad("0xabcd", 32);
        var signature = await alice.signMessage(ethers.utils.arrayify(message));
        var sig = ethers.utils.splitSignature(signature);
        const request = {
            message: message,
            v: sig.v,
            r: sig.r,
            s: sig.s
        }

        await (await nba.connect(alice).mint_approved(request)).wait();
       //4. Bob replay Alice's proof and mint tokens without authorization 
       await (await nba.connect(bob).mint_approved(request)).wait();
       console.log("Bob now has ", await nba.balanceOf(bob.address), " tokens")
    });

    it("2. replay attack failed due to intercept", async function(){
        const [owner, alice, bob] = await ethers.getSigners();
       //1. Deploy NBA
        const NBA = await ethers.getContractFactory("SafeNBA", owner);
        const nba = await NBA.deploy();
        await nba.deployed();
        console.log("nba contract deployed to ", nba.address);

       //2. Set Alice as whitelist user
        await (await nba.connect(owner).setWhitelist([alice.address])).wait();
        console.log("alice ", alice.address, " already whitelisted");
       //3. Alice create his proof and mint tokens
        var message = ethers.utils.hexZeroPad("0xabcd", 32);
        var signature = await alice.signMessage(ethers.utils.arrayify(message));
        var sig = ethers.utils.splitSignature(signature);
        const request = {
            message: message,
            v: sig.v,
            r: sig.r,
            s: sig.s
        }

        await (await nba.connect(alice).mint_approved(request)).wait();
       //4. Bob replay Alice's proof and mint tokens without authorization 
       await expect(nba.connect(bob).mint_approved(request)).to.be.reverted;
    });
})
