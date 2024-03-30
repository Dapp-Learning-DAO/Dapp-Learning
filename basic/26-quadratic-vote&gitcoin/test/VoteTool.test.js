// This is an exmaple test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require('chai')
const { BigNumber } = require('ethers')


// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` recieves the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe('VotingTool', function () {
  // Mocha has four functions that let you hook into the  test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let voteToolContractFactory
  let voteTool
  let owner
  let addr1
  let addr2
  let addrs

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    voteToolContractFactory = await ethers.getContractFactory('VoteTool')
    ;[owner, addr1, addr2, ...addrs] = await ethers.getSigners()

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    voteTool = await voteToolContractFactory.deploy()
    await voteTool.deployed()
  })

  // You can nest describe calls to create subsections.
  describe('Proposals', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it('Before add proposal, should transform it to bytes32', async function () {
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await voteTool.hash(proposalBytes32)

      // Add Proposal
      await voteTool.addProposal(proposalHashId)
      
    })


    it('After add proposals, we can get the detail of proposal', async function () {

      // Proposal context
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await voteTool.hash(proposalBytes32)

      // Add Proposal
      await voteTool.addProposal(proposalHashId)

      // Get the proposal we just added, and check whether their value are correct
      let [proposalName, voteCount, donationAmount,proposalStauts] = await voteTool.getProposal(0)

      // Compare the proposalName
      expect(parseInt(proposalName)).to.equal(parseInt(proposalHashId))

      // Compare the voteCount
      expect(voteCount).to.equal(0)

      // Compare the donationAmount
      expect(donationAmount).to.equal(0)

      // Compare the proposalStauts
      expect(proposalStauts).to.equal(1)

    })


    it('After add proposals, we can get the total proposal numbers', async function () {

      // First proposal context
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let firstProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await voteTool.hash(firstProposalBytes32)

      // Add the first proposal
      await voteTool.addProposal(firstProposalHashId)

      // Second proposal context
      let secondProposal = "Go to park"

      // Bytes32 : "0x476f20746f207061726b00000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await voteTool.hash(secondProposalBytes32)

      // Add the first proposal
      await voteTool.addProposal(secondProposalHashId)

      // Get the total number of proposals
      let proposalLength = await voteTool.getProposalLength()

      // The proposal length should be 2
      expect(proposalLength).to.equal(2)

    })

    it('We can cancel the proposal if we don not want it anymore', async function () {

      // Proposal context
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await voteTool.hash(proposalBytes32)

      // Add Proposal
      await voteTool.addProposal(proposalHashId)

      // Get the proposal we just added, and check whether their value are correct
      let [proposalName, voteCount, donationAmount,proposalStauts] = await voteTool.getProposal(0)

      // Compare the proposalStauts
      expect(proposalStauts).to.equal(1)

      // Expire the proposal
      await voteTool.expireProposal(proposalHashId)

      // The status of proposal should be 2
      ;[proposalName, voteCount, donationAmount,proposalStauts] = await voteTool.getProposal(0)

      // Compare the proposalStauts
      expect(proposalStauts).to.equal(2)

    })
  })


  describe('Votes', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it('User can not votes to a nonexist proposal', async function () {
      //Connect to addr1, later we will use addr1 to send trans
      voteTool.connect(addr1)

      // Try to vote nonexist proposal
      await expect(voteTool.vote(0,10)).to.be.revertedWith("not exists")
    })

    it('User try to vote a proposal, but do not have enough ETH', async function () {
      // Proposal context
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await voteTool.hash(proposalBytes32)

      // Add Proposal
      await voteTool.addProposal(proposalHashId)

      //Connect to addr1, later we will use addr1 to send trans
      let userContract = voteTool.connect(addr1)

      // Try to vote first proposal with 10 votes
      await expect(userContract.vote(proposalHashId,10)).to.be.revertedWith("not enough")
    })

    it('User vote a proposal successfully, and we can get user VoteNum', async function () {
      // Proposal context
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await voteTool.hash(proposalBytes32)

      // Add Proposal
      await voteTool.addProposal(proposalHashId)

      //Connect to addr1, later we will use addr1 to send trans
      let userContract = voteTool.connect(addr1)

      let overrides = {
        // To convert Ether to Wei:
        value: ethers.utils.parseEther("10.0")     // ether in this case MUST be a string
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      // Try to vote first proposal with 2 votes
      await userContract.vote(proposalHashId,2,overrides)

      // Get user vote num
      let userVoteNum = await userContract.getUserVoteNum(addr1.address,proposalHashId)

      // Compare user vote num
      expect(userVoteNum).to.equal(2)

    })

  })
  
})
