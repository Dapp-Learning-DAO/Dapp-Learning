const { expect } = require("chai");

describe("MemberVote contract", function () {
    let voteContractFactory;
    let ownerContract;
    let memberContract;
    let cartContract;
    let dogContract
    let artifact;
    let Alice;
    let Bob;
    let Cart;
    let Dog;

    it("Deploy MemberVote Contract",async function () {
        [Alice, Bob, Cart, Dog] = await ethers.getSigners()
        voteContractFactory = await ethers.getContractFactory('MembersVote')

        ownerContract = await voteContractFactory.deploy(100, 100, 2)
        await ownerContract.deployed()

        artifact = artifacts.readArtifactSync('MembersVote')
        memberContract = new ethers.Contract(ownerContract.address, artifact.abi, Bob)
        cartContract = new ethers.Contract(ownerContract.address, artifact.abi, Cart) 
        dogContract = new ethers.Contract(ownerContract.address, artifact.abi, Dog)

        expect(ownerContract.address).to.not.equal(null)
    })

    it('Contribute to the club', async function () {
        let overrides = {
            // To convert Ether to Wei:
            value: 101,
        }
        await memberContract.contribute(overrides)

        expect((await memberContract.shares(Bob.address)).toString()).to.equal('101')
    })

    it("You can't redeem more than your share", async function () {
        await expect(memberContract.redeemShare(200)).to.be.revertedWith("not enough shares")
    })

    it("You can redeem less than your share", async function () {
        await memberContract.redeemShare(1)
        expect((await memberContract.shares(Bob.address)).toString()).to.equal('100')
    })

    it("You can't transfer shares more than your share", async function () {
        await expect(memberContract.transferShare(200,Cart.address)).to.be.revertedWith("not enough shares")
    })

    it("You can transfer shares less than your share", async function () {
        await memberContract.transferShare(10,Cart.address)
        
        expect((await memberContract.shares(Bob.address)).toString()).to.equal('90')
    })

    it("Create a proposal with too much amount will fail", async function () {
        await expect(memberContract.createProposal("Buy toys",200,Cart.address)).to.be.revertedWith("amount too big")
    })

    it("Can create a proposal with too amount less than availableFunds", async function () {
        await memberContract.createProposal("Buy toys", 20, Cart.address) 
    })

    it("Can vote to a proposal", async function () {
        await cartContract.contribute({ value: 100 })
        await dogContract.contribute({ value: 100 })
        
        await cartContract.vote(0)
        await dogContract.vote(0)
    })


});

