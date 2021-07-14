const { expect } = require("chai");

describe("Project contract", function () {
    let projectContractFactory;
    let projectContract;
    let creator;
    let donator1;
    let donator2;

    beforeEach(async function () {
        [creator,donator1,donator2] = await ethers.getSigners();
        console.log(creator.address)
        projectContractFactory = await ethers.getContractFactory("Project");
        const expiretime = parseInt(new Date().getTime()/1000) + 7 * 24 * 60 * 60

        projectContract = await projectContractFactory.deploy(creator.address,"Buy some toys","Buy some toys",expiretime,100);
        await projectContract.deployed();
        
        expect(projectContract.address).to.not.equal(null);
      });

    describe('Start a new Project', function () {
      // `it` is another Mocha function. This is the one you use to define your
      // tests. It receives the test name, and a callback function.

      it('Get details of a new project', async function () {
        let projectDetail = await projectContract.getDetails()
        expect(projectDetail.goalAmount).to.equal(100)
      })
    })

    describe('Check If Funding Complete Or Expired', function () {
      // `it` is another Mocha function. This is the one you use to define your
      // tests. It receives the test name, and a callback function.

      it('Get the complete time', async function () {
        await projectContract.checkIfFundingCompleteOrExpired()
        expect(parseInt(await projectContract.completeAt())).to.not.equal(null);
      })
    })

    describe('Contribute to project ', function () {
        // `it` is another Mocha function. This is the one you use to define your
        // tests. It receives the test name, and a callback function.

        it('Donate with calling contribute ', async function () {
            let overrides = {
                // To convert Ether to Wei:
                value: 10,
            }

            const artifact = artifacts.readArtifactSync("Project")
            const transactionContract = new ethers.Contract(projectContract.address, artifact.abi, donator1);
            await transactionContract.contribute(overrides)
        
            expect(parseInt(await transactionContract.currentBalance())).to.equal(10)
        })
    })

    describe('Project successed when get enough donation', function () {
        // `it` is another Mocha function. This is the one you use to define your
        // tests. It receives the test name, and a callback function.
        
        
        it('Donate 101', async function () {
            let overrides = {
                // To convert Ether to Wei:
                value: 101,
            }

            const artifact = artifacts.readArtifactSync("Project")
            const transactionContract = new ethers.Contract(projectContract.address, artifact.abi, donator1);
            await transactionContract.contribute(overrides)
        
            expect(parseInt(await transactionContract.state())).to.equal(2)
        })
    })

    describe('Creator get payout when donation success', function () {
        // `it` is another Mocha function. This is the one you use to define your
        // tests. It receives the test name, and a callback function.
        
        
        it('Payout to the creator', async function () {
            let overrides = {
                // To convert Ether to Wei:
                value: 101,
                gasPrice: 1000
            }

            const artifact = artifacts.readArtifactSync("Project")
            const transactionContract = new ethers.Contract(projectContract.address, artifact.abi, donator1);
            await transactionContract.contribute(overrides)

        })
    })

});

