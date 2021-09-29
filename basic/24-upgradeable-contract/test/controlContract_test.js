const { expect } = require('chai');

describe('Control contract', function () {
  let dataContract;
  let controlContract;
  let alice;

  beforeEach(async function () {
    [alice] = await ethers.getSigners();

    // Deploy DataContract
    let dataContractFactory = await ethers.getContractFactory('DataContract');
    dataContract = await dataContractFactory.deploy();
    await dataContract.deployed();

    // Deploy ControlContract
    let controlContractFactory = await ethers.getContractFactory(
      'ControlContract'
    );
    controlContract = await controlContractFactory.deploy(dataContract.address);
    await controlContract.deployed();
  });

  it('Only deployer can set the balance', async function () {
    const artifact = artifacts.readArtifactSync('DataContract');
    const aliceDataContract = new ethers.Contract(
      dataContract.address,
      artifact.abi,
      alice
    );
    await aliceDataContract.setBalance(alice.address, 100);

    // Check balance
    expect(await aliceDataContract.getBalance(alice.address)).to.equal(100);
  });

  it('Other account cannot set the balance', async function () {
    await expect(
      controlContract.setBalance(controlContract.address, 100)
    ).to.be.revertedWith('Not sufficient permission');
  });

  it('The control contract can send TX when it has permission', async function () {

    const artifact = artifacts.readArtifactSync('DataContract');
    const aliceDataContract = new ethers.Contract(
      dataContract.address,
      artifact.abi,
      alice
    );
    await aliceDataContract.allowAccess(controlContract.address);

    // Control Contract set balance
    await controlContract.setBalance(controlContract.address, 100);

    // Check balance
    expect(await controlContract.getBalance(controlContract.address)).to.equal(
      100
    );
  });
});
