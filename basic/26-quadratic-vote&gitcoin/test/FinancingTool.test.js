// This is an exmaple test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require('chai')


// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` recieves the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe('FinancingTool', function () {
  // Mocha has four functions that let you hook into the  test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let financingToolContractFactory
  let financingTool
  let owner
  let addr1
  let addr2
  let addrs

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    financingToolContractFactory = await ethers.getContractFactory('FinancingTool')
      ;[owner, addr1, addr2, ...addrs] = await ethers.getSigners()

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    financingTool = await financingToolContractFactory.deploy()
    await financingTool.deployed()
  })

  // You can nest describe calls to create subsection
  describe('Proposals', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it('Before add proposal, should transform it to bytes32', async function () {
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await financingTool.hash(proposalBytes32)

      // Add Proposal
      await financingTool.addProposal(proposalHashId)

    })

    it('We can add more than one proposal', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Second proposal
      let secondProposal = "Buy cars"

      // Bytes32 : "0x4275792063617273000000000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await financingTool.hash(secondProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(secondProposalHashId)

    })

    it('We can add more than one proposal', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Second proposal
      let secondProposal = "Buy cars"

      // Bytes32 : "0x4275792063617273000000000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await financingTool.hash(secondProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(secondProposalHashId)

    })

    it('Check total proposals after add proposal', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Check the total proposal 
      let totalProposal = await financingTool.getProposalLength()

      // Compare the proposalStauts
      expect(totalProposal).to.equal(1)

    })

    it('Get proposal info with proposal index', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Get proposal info with proposal index
      let [propsalName,proposalAmount,proposalVoteCount,proposalUserAddressArrLength] = await financingTool.getProposal(0)

      // Compare the propsalName
      expect(propsalName).to.equal(firstProposalHashId)

      // Compare the propsalName
      expect(proposalAmount).to.equal(0)

      // Compare the propsalName
      expect(proposalVoteCount).to.equal(0)

      // Compare the propsalName
      expect(proposalUserAddressArrLength).to.equal(0)

    })

  })

  describe('Vote', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it('User can vote to a proposal', async function () {
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await financingTool.hash(proposalBytes32)

      // Add Proposal
      await financingTool.addProposal(proposalHashId)

      // User contract 
      let userContract = financingTool.connect(addr1)

      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      // Try to vote first proposal with 1 votes
      await userContract.vote(proposalHashId,4,overrides)

      //Check the user vote num
      let [usVoteAmount, usVoteCount] = await userContract.getUserVoteNum(addr1.address,proposalHashId)

      // Compare the usVoteAmount
      expect(usVoteAmount).to.equal(4)

      // Compare the usVoteCount
      expect(usVoteCount).to.equal(2)
    })

    it('User vote amount is refer to transfer value, not to parameters', async function () {
      let proposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)

      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await financingTool.hash(proposalBytes32)

      // Add Proposal
      await financingTool.addProposal(proposalHashId)

      // User contract 
      let userContract = financingTool.connect(addr1)

      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      //Though you claim you vote 8 , but the actual value is 4, which is the value you transfter to the proposal contract
      await userContract.vote(proposalHashId,8,overrides)

      //Check the user vote num
      let [usVoteAmount, usVoteCount] = await userContract.getUserVoteNum(addr1.address,proposalHashId)

      // Compare the usVoteAmount
      expect(usVoteAmount).to.equal(4)

      // Compare the usVoteCount
      expect(usVoteCount).to.equal(2)
    })

    it('We can get proposal user info with specific proposal', async function () {
      let proposal = "Buy toys"
  
      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)
  
      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await financingTool.hash(proposalBytes32)
  
      // Add Proposal
      await financingTool.addProposal(proposalHashId)
  
      // User contract 
      let userContract = financingTool.connect(addr1)
  
      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };
  
      // Try to vote first proposal with 1 votes
      await userContract.vote(proposalHashId,4,overrides)
  
      //Get the user addresses from teh proposal
      let userAddrArr = await userContract.getProposalUser(proposalHashId,0,1)
  
      // Compare the usVoteAmount
      expect(userAddrArr[0]).to.equal(addr1.address)
    })

    it('Instead of vote to a proposal, user can add extra amount to a proposal, which not record user vote', async function () {
      let proposal = "Buy toys"
  
      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let proposalBytes32 = ethers.utils.formatBytes32String(proposal)
  
      // Every proposal should be trans to hash before they are added into proposals
      let proposalHashId = await financingTool.hash(proposalBytes32)
  
      // Add Proposal
      await financingTool.addProposal(proposalHashId)
  
      // User contract 
      let userContract = financingTool.connect(addr1)
  
      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };
  
      // Add extra amount to proposal contract
      await userContract.addExtraAmount(addr1.address,4,overrides)
    })

    it('We can get total vote count of all the proposals', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Second proposal
      let secondProposal = "Buy cars"

      // Bytes32 : "0x4275792063617273000000000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await financingTool.hash(secondProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(secondProposalHashId)

      // User contract 
      let userContract = financingTool.connect(addr1)

      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      //Vote to the first proposal
      await userContract.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContract.vote(secondProposalHashId,4,overrides)

      //Get total vote count of two proposals
      let totalVoteCount = await userContract.getTotalCount()

      // Compare the usVoteAmount
      expect(totalVoteCount).to.equal(4)

    })

    it('We can get total vote count of all the proposals', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Second proposal
      let secondProposal = "Buy cars"

      // Bytes32 : "0x4275792063617273000000000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await financingTool.hash(secondProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(secondProposalHashId)

      // User contract 
      let userContractAlice = financingTool.connect(addr1)

      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      //Vote to the first proposal
      await userContractAlice.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContractAlice.vote(secondProposalHashId,4,overrides)

      // User contract 
      let userContractBob = financingTool.connect(addr2)

      //Vote to the first proposal
      await userContractBob.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContractBob.vote(secondProposalHashId,4,overrides)

      // Change the transfer value 
      overrides.value = 4000

      // Add extra amount to proposal contract
      await userContractBob.addExtraAmount(addr2.address,4,overrides)

      // Get proposal result 
      let [proposalAmount,proposalVoteCount] = await userContractBob.getResult(secondProposalHashId)

      // Compare the proposalAmount
      expect(parseInt(proposalAmount)).to.equal(2008)

      // Compare the proposalVoteCount
      expect(parseInt(proposalVoteCount)).to.equal(4)

    })

    it('Owner can withdraw a specific proposal', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Second proposal
      let secondProposal = "Buy cars"

      // Bytes32 : "0x4275792063617273000000000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await financingTool.hash(secondProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(secondProposalHashId)

      // User contract 
      let userContractAlice = financingTool.connect(addr1)

      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      //Vote to the first proposal
      await userContractAlice.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContractAlice.vote(secondProposalHashId,4,overrides)

      // User contract 
      let userContractBob = financingTool.connect(addr2)

      //Vote to the first proposal
      await userContractBob.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContractBob.vote(secondProposalHashId,4,overrides)

      // Change the transfer value 
      overrides.value = 4000

      // Add extra amount to proposal contract
      await userContractBob.addExtraAmount(addr2.address,4,overrides)

      // Withdraw first proposal
      await financingTool.withdrawProposal(firstProposalHashId)

    })

    it('Owner can withdraw all amount', async function () {
      // First proposal
      let firstProposal = "Buy toys"

      // Bytes32 : "0x42757920746f7973000000000000000000000000000000000000000000000000"
      let fristProposalBytes32 = ethers.utils.formatBytes32String(firstProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let firstProposalHashId = await financingTool.hash(fristProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(firstProposalHashId)
      
      // Second proposal
      let secondProposal = "Buy cars"

      // Bytes32 : "0x4275792063617273000000000000000000000000000000000000000000000000"
      let secondProposalBytes32 = ethers.utils.formatBytes32String(secondProposal)

      // Every proposal should be trans to hash before they are added into proposals
      let secondProposalHashId = await financingTool.hash(secondProposalBytes32)

      // Add first Proposal
      await financingTool.addProposal(secondProposalHashId)

      // User contract 
      let userContractAlice = financingTool.connect(addr1)

      let overrides = {
        value: 4  // the value is cong
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
      };

      //Vote to the first proposal
      await userContractAlice.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContractAlice.vote(secondProposalHashId,4,overrides)

      // User contract 
      let userContractBob = financingTool.connect(addr2)

      //Vote to the first proposal
      await userContractBob.vote(firstProposalHashId,4,overrides)

      //Vote to the second proposal
      await userContractBob.vote(secondProposalHashId,4,overrides)

      // Change the transfer value 
      overrides.value = 4000

      // Add extra amount to proposal contract
      await userContractBob.addExtraAmount(addr2.address,4,overrides)

      // Withdraw first proposal
      await financingTool.withdraw()

      let provider = ethers.getDefaultProvider()

      const balance = await provider.getBalance(userContractBob.address)

      //After withdraw all of the amount, the proposal contract balance should be zero
      expect(parseInt(balance)).to.equal(0)

    })

  })

})
