const { expect } = require("chai");
 
describe('ERC1155 compatible logic', async () => {

  let owner;
  let alice;
  let bob;
  let charlie;
  let gameItemsContract;

  beforeEach(async function () {
    // get addresses
    [owner,alice,bob,charlie] =  await hre.ethers.getSigners();

    // Deploy ERC1155 contract
    const gameItemsFactory = await ethers.getContractFactory("GameItems");
    gameItemsContract = await gameItemsFactory.deploy();

  });


  it('Check Balance for each token', async () => {
    // Check balance of token GOLD
    let balanceOfGOLD = await gameItemsContract.balanceOf(owner.address,0);
    expect(Number(balanceOfGOLD)).to.equal(10**18);

    // Check balance of token SILVER
    let balanceOfSILVER = await gameItemsContract.balanceOf(owner.address,1);
    expect(Number(balanceOfSILVER)).to.equal(10**27);

    // Check balance of token SILVER
    let balanceOfTHORS_HAMMER = await gameItemsContract.balanceOf(owner.address,2);
    expect(Number(balanceOfTHORS_HAMMER)).to.equal(1);

    // Check balance of token SWORD
    let balanceOfSWORD = await gameItemsContract.balanceOf(owner.address,3);
    expect(Number(balanceOfSWORD)).to.equal(10**9);

    // Check balance of token SHIELD
    let balanceOfSHIELD = await gameItemsContract.balanceOf(owner.address,4);
    expect(Number(balanceOfSHIELD)).to.equal(10**9);

  })

  it('Check Balance for each token', async () => {
    // Check balance of token GOLD
    let balanceOfGOLD = await gameItemsContract.balanceOf(owner.address,0);
    expect(Number(balanceOfGOLD)).to.equal(10**18);

    // Check balance of token SILVER
    let balanceOfSILVER = await gameItemsContract.balanceOf(owner.address,1);
    expect(Number(balanceOfSILVER)).to.equal(10**27);

    // Check balance of token SILVER
    let balanceOfTHORS_HAMMER = await gameItemsContract.balanceOf(owner.address,2);
    expect(Number(balanceOfTHORS_HAMMER)).to.equal(1);

    // Check balance of token SWORD
    let balanceOfSWORD = await gameItemsContract.balanceOf(owner.address,3);
    expect(Number(balanceOfSWORD)).to.equal(10**9);

    // Check balance of token SHIELD
    let balanceOfSHIELD = await gameItemsContract.balanceOf(owner.address,4);
    expect(Number(balanceOfSHIELD)).to.equal(10**9);

  })

  it('Check batch balances for accounts', async () => {
    // Check batch balance of alice
    let accounts = [owner.address,owner.address,owner.address];
    let ids = [0,1,2];
    let batchBalance = await gameItemsContract.balanceOfBatch(accounts,ids);
    expect(Number(batchBalance[0])).to.equal(10**18);
    expect(Number(batchBalance[1])).to.equal(10**27);
    expect(Number(batchBalance[2])).to.equal(1);

  })

  it('Batch Transfer', async () => {
    // Approve for other account
    await gameItemsContract.setApprovalForAll(alice.address,true);

    // Batch Tranfer from owner to alice
    let ids = [0,1];
    let amounts = [10,20];
    const additionalData = ethers.utils.formatBytes32String("777TestData")
    let gameItemsContractAlice = gameItemsContract.connect(alice);
    await gameItemsContractAlice.safeBatchTransferFrom(owner.address,alice.address,ids,amounts,additionalData);

    // Check balance 
    let accounts = [alice.address,alice.address];
    let batchBalance = await gameItemsContract.balanceOfBatch(accounts,ids);
    expect(Number(batchBalance[0])).to.equal(10);
    expect(Number(batchBalance[1])).to.equal(20);
  })

})
