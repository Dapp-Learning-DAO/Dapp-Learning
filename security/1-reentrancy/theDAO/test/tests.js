const {expect} = require("chai");
const {ethers, network, waffle} = require("hardhat");
require("@nomiclabs/hardhat-waffle");
const provider = waffle.provider;


describe("reentrancy attack", function() {
    var vaultOwner, maliciousUser, user2,user3;
    before(async function(){
        [vaultOwner, user1, user2,user3] = await ethers.getSigners();
    });
 
    it("1 attack success", async function(){
        //1. Set up vault
        var Vault = await ethers.getContractFactory("BuggyVault", vaultOwner);
        var vault = await Vault.deploy();
        await vault.deployed();
        console.log("Buggy vault deployed to", vault.address);
        //2. Set up malicious contract
        var Malicious = await ethers.getContractFactory("Malicious", user1);
        var malicious = await Malicious.deploy(vault.address);
        await malicious.deployed();
        console.log("Malicious contract deployed to", malicious.address);
        //3. Lots of users including malicious one, send ethers to vault
        var tx1 = await malicious.connect(user1).addDeposit({value: 10000});
        var tx2 = await vault.connect(user2).deposit({value:10000});
        var tx3 = await vault.connect(user3).deposit({value:10000});
        await tx1.wait();
        await tx2.wait();
        await tx3.wait();

        console.log("user1(malicious) has balance in vault:", (await vault.balances(malicious.address)).toNumber());
        console.log("user2 has balance in vault:", (await vault.balances(user2.address)).toNumber());
        console.log("user1 has balance in vault:", (await vault.balances(user3.address)).toNumber());

        //4. Malicious contract reentrant
        // await expect(malicious.connect(user1).withdrawFromVault()).to.be.reverted;
        await (await malicious.connect(user1).withdrawFromVault()).wait();
        //5. Check money
        console.log("user1(malicious)becomes rich:", (await provider.getBalance(malicious.address)).toNumber());
        await (await vault.connect(user2).withdraw()).wait();
        await (await vault.connect(user3).withdraw()).wait();
        console.log("user2 and user3 would not take their money any more!");
    });

    it("2 attack failed due to reentrancy", async function(){
        //1. Set up vault
        var Vault = await ethers.getContractFactory("SafeVault1", vaultOwner);
        var vault = await Vault.deploy();
        await vault.deployed();

        //2. Set up malicious contract
        var Malicious = await ethers.getContractFactory("Malicious", user1);
        var malicious = await Malicious.deploy(vault.address);
        await malicious.deployed();

        //3. Lots of users including malicious one, send ethers to vault
        var tx1 = await malicious.connect(user1).addDeposit({value: 10000});
        var tx2 = await vault.connect(user2).deposit({value:10000});
        var tx3 = await vault.connect(user3).deposit({value:10000});
        await tx1.wait();
        await tx2.wait();
        await tx3.wait();

        //4. Malicious contract reentrant
        await (await malicious.connect(user1).withdrawFromVault()).wait();
        expect((await vault.balances(malicious.address))).equal(0);
        expect((await provider.getBalance(vault.address))).equal(30000);
        console.log("user1(malicious) failed to withdraw because of reentrancy guard!");
    });

    it("3 attack failed due to check-effects-interact", async function(){
        //1. Set up vault
        var Vault = await ethers.getContractFactory("SafeVault2", vaultOwner);
        var vault = await Vault.deploy();
        await vault.deployed();

        //2. Set up malicious contract
        var Malicious = await ethers.getContractFactory("Malicious", user1);
        var malicious = await Malicious.deploy(vault.address);
        await malicious.deployed();

        //3. Lots of users including malicious one, send ethers to vault
        var tx1 = await malicious.connect(user1).addDeposit({value: 10000});
        var tx2 = await vault.connect(user2).deposit({value:10000});
        var tx3 = await vault.connect(user3).deposit({value:10000});
        await tx1.wait();
        await tx2.wait();
        await tx3.wait();

        //4. Malicious contract reentrant (would not panic because call does not revert by default)
        await (await malicious.connect(user1).withdrawFromVault()).wait();
        expect((await vault.balances(malicious.address))).equal(0);
        expect((await provider.getBalance(vault.address))).equal(30000);
        console.log("user1(malicious) failed to withdraw because of check-effects-interact!");
    });

    it("4 attack failed due to careful use of \'call()\'", async function(){
        //1. Set up vault
        var Vault = await ethers.getContractFactory("SafeVault3", vaultOwner);
        var vault = await Vault.deploy();
        await vault.deployed();

        //2. Set up malicious contract
        var Malicious = await ethers.getContractFactory("Malicious", user1);
        var malicious = await Malicious.deploy(vault.address);
        await malicious.deployed();

        //3. Lots of users including malicious one, send ethers to vault
        var tx1 = await malicious.connect(user1).addDeposit({value: 10000});
        var tx2 = await vault.connect(user2).deposit({value:10000});
        var tx3 = await vault.connect(user3).deposit({value:10000});
        await tx1.wait();
        await tx2.wait();
        await tx3.wait();

        //4. Malicious contract reentrant
         await expect(malicious.connect(user1).withdrawFromVault()).to.be.reverted;
         console.log("user1(malicious) failed to withdraw because of careful use of \'call()\'!");
    });
});


