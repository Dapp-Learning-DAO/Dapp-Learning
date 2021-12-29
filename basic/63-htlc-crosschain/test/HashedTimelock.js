const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

const {
    bufToStr,
    getBalance,
    htlcArrayToObj,
    isSha256Hash,
    newSecretHashPair,
    nowSeconds,
    random32,
} = require('./helper/utils')

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
};

describe("HashedTimelock", function () {
    let Alice;
    let Bob;
    let Cart;
    let Dive;
    let contractAlice;
    let contractBob;
    let hashPair;
    let timeLock1Hour;


    beforeEach(async function () {
        ;[Alice, Bob, Cart, Dive] = await ethers.getSigners();

        // Get deploy two Hash Contract
        const HashedTimelockFactory = await ethers.getContractFactory("HashedTimelock");
        contractAlice = await HashedTimelockFactory.deploy();
        await contractAlice.deployed();
        contractBob = await HashedTimelockFactory.deploy();
        await contractBob.deployed();

        // Parameters
        hashPair = newSecretHashPair();
        timeLock1Hour = nowSeconds() + 1000;

    });

    it("newContract() should create new contract and store correct details", async function () {
        // Listen to event log
        contractAlice.once('LogHTLCNew', (contractId, sender, receiver, amount, hashlock, timelock) => {
            // Check event value
            console.log("Get Event, and going to check the event value");
            console.log("contractId:",contractId.toString());
            expect(sender).to.be.equal(Alice.address);
            expect(receiver).to.be.equal(Bob.address);
            expect(amount).to.be.equal(100);
            expect(hashlock).to.be.equal(hashPair.hash);
            expect(timelock).to.be.equal(timeLock1Hour);
        });

        // Call newContract  
        const txReceipt = await contractAlice.newContract(
            Bob.address,
            hashPair.hash,
            timeLock1Hour,
            {
                from: Alice.address,
                value: 100,
            }
        );
        
        // Waiting for event check
        await txReceipt.wait();
        await wait(5000);

    });

    it('newContract() should fail with timelocks in the past', async () => {
        // Set Timelock value to the past
        const pastTimelock = nowSeconds() - 1
        await expect(contractAlice.newContract(
            Bob.address,
            hashPair.hash,
            pastTimelock,
            {
                from: Alice.address,
                value: 100,
            }
        )).to.be.revertedWith('timelock time must be in the future');
      });


      it('withdraw() should send receiver funds when given the correct secret preimage', async () => {
        let constractIdInHash;
        // Listen to event log
        contractAlice.once('LogHTLCNew', (contractId, sender, receiver, amount, hashlock, timelock) => {
            // Get the contractId
            constractIdInHash = contractId
        });

        // Alice Call newContract 
        const txReceipt = await contractAlice.newContract(
            Bob.address,
            hashPair.hash,
            timeLock1Hour,
            {
                from: Alice.address,
                value: 100,
            }
        );
        
        // Waiting for event check
        await txReceipt.wait();
        await wait(5000);
        
        // Bob going to do Withdraw 
        contractBob = contractAlice.connect(Bob);
        await contractBob.withdraw(constractIdInHash,hashPair.secret);  
      });
});