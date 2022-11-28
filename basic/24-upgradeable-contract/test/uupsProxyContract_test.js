
// test/update-test.ts
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');


let myLogicV1;
let myLogicV2;

describe('uups mode upgrade', function () {
  it('deploys', async function () {
    const MyLogicV1 = await ethers.getContractFactory('MyLogicV1');
      myLogicV1 = (await upgrades.deployProxy(MyLogicV1, {kind: 'uups'}));
      console.log(myLogicV1.address);
  })
  it('myLogicV1 set', async function () {
    await myLogicV1.SetLogic("aa", 1);
    expect((await myLogicV1.GetLogic("aa")).toString()).to.equal('1');
  })
  it('upgrades', async function () {
    const MyLogicV2 = await ethers.getContractFactory('MyLogicV2');
      myLogicV2 = (await upgrades.upgradeProxy(myLogicV1, MyLogicV2));
      console.log(myLogicV2.address);
  })
  it('myLogicV2 get', async function () {
      expect((await myLogicV2.GetLogic("aa")).toString()).to.equal('101');
  })
})