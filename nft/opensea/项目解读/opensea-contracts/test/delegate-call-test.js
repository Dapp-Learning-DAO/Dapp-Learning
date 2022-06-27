const { expect } = require("chai");
const { ethers } = require("hardhat");

const { constants } = ethers;

describe("CALL vs DELEGATECALL", function () {
  let a, c, b, e;
  let A, C, B, E;

  before(async () => {
    A = await ethers.getContractFactory("A");
    B = await ethers.getContractFactory("B");
    C = await ethers.getContractFactory("C");
    E = await ethers.getContractFactory("E");

    a = await A.deploy();
    await a.deployed();

    c = await C.deploy();
    await c.deployed();

    b = await B.deploy();
    await b.deployed();

    e = await E.deploy();
    await e.deployed();
  });

  // it("callInc", async function () {
  //   await a.callInc(e.address);
  //   expect(await a.i()).equals(0);
  //   expect(await e.i()).equals(1);
  //   expect(await e.sender()).equals(a.address);
  // });

  // it("delegateCallInc", async function () {
  //   let signer = await ethers.getSigner();
  //   a = await a.connect(signer);
  //   await a.delegateCallInc(e.address);
  //   expect(await a.i()).equals(1);
  //   expect(await e.i()).equals(0);
  //   expect(await a.sender()).equals(signer.address);
  //   expect(await e.sender()).equals(constants.AddressZero);
  // });

  // it("callSetN", async function () {
  //   await b.callSetN(e.address, 3);
  //   expect(await e.sender()).equals(b.address);
  //   expect(await b.n()).equals(0);
  //   expect(await e.n()).equals(3);
  // });

  // it("delegatecallSetN", async () => {
  //   let signer = await ethers.getSigner();
  //   await b.delegatecallSetN(e.address, 3);

  //   expect(await b.n()).equals(3);
  //   expect(await e.n()).equals(0);

  //   expect(await b.sender()).equals(signer.address);
  //   expect(await e.sender()).equals(constants.AddressZero);
  // });

  it("foo", async () => {
    await c.foo(b.address, e.address, 4);
    expect(await b.sender()).equals(c.address);
    expect(await e.sender()).equals(constants.AddressZero);
    expect(await b.n()).equals(4);
    expect(await e.n()).equals(0);
  });
});
