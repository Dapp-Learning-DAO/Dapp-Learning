import { expect } from "chai";
import { starknet } from "hardhat";
import { StarknetContract, StarknetContractFactory } from "hardhat/types/runtime";
import { TIMEOUT } from "./constants";

describe("Starknet", function () {
  this.timeout(TIMEOUT);
  let preservedAddress: string;

  let contractFactory: StarknetContractFactory;

  before(async function() {
    // assumes contract.cairo has been compiled
    contractFactory = await starknet.getContractFactory("contract");
  });

  it("should fail if constructor arguments not provided", async function() {
    try {
      await contractFactory.deploy();
      expect.fail("Should have failed on not passing constructor calldata.");
    } catch(err: any) {
      expect(err.message).to.equal("Constructor arguments required but not provided.");
    }
  });

  it("should work for a fresh deployment", async function() {
    console.log("Started deployment");
    const contract: StarknetContract = await contractFactory.deploy({ initial_balance: 0 });
    console.log("Deployed at", contract.address);
    preservedAddress = contract.address;

    const { res: balanceBefore } = await contract.call("get_balance");
    expect(balanceBefore).to.deep.equal(0n);

    await contract.invoke("increase_balance", { amount1: 10, amount2: 20 });
    console.log("Increased by 10 + 20");

    const { res: balanceAfter } = await contract.call("get_balance");
    expect(balanceAfter).to.deep.equal(30n);
  });

  it("should work for a previously deployed contract", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);
    const { res: balance } = await contract.call("get_balance");
    expect(balance).to.deep.equal(30n);
  });

  it("should work with tuples", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);
    // passing Points (1, 2) and (3, 4) in a tuple
    const { res: sum } = await contract.call("sum_points_to_tuple", {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]
    });
    expect(sum).to.deep.equal([4n, 6n]);
  });

  it("should work with complex tuples", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);
    // passing PointPair ((1, 2), (3, 4), 5)
    // the five is an extra number added to each member of the sum Point
    const { res: sum } = await contract.call("sum_point_pair", {
      pointPair: {
        p1: { x: 1, y: 2 },
        p2: { x: 3, y: 4 },
        extra: 5
      }
    });
    expect(sum).to.deep.equal({ x: 9n, y: 11n });
  });

  async function testArray(args: {a: number[]}, expected: bigint) {
    const contract = contractFactory.getContractAt(preservedAddress);
    const { res: sum } = await contract.call("sum_array", args);
    expect(sum).to.deep.equal(expected);
  }

  it("should work with a non-empty array", async function() {
    await testArray({a: [1, 2, 3, 4] }, 10n);
  });

  it("should work with an empty array", async function() {
    await testArray({a: []}, 0n);
  });

  it("should work with returned arrays", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);
    const a = [1n, 2n, 3n];
    const execution = await contract.call("identity", { a });
    const arrLengthSquared = a.length * a.length;
    expect(execution).to.deep.equal({
      res: a,
      res_len: BigInt(a.length),
      res_len_squared: BigInt(arrLengthSquared)
    });
  });

  it("should work with imported custom functions", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);
    const { res: res0 } = await contract.call("use_almost_equal", {a: 1, b: 3});
    expect(res0).to.deep.equal(0n); // 0 as in false

    const { res: res1 } = await contract.call("use_almost_equal", {a: 1, b: 2});
    expect(res1).to.deep.equal(1n); // 1 as in true
  });

  it("should work with BigInt arguments instead of numbers", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);

    // mixing bigint and number on purpose (to show it's possible)
    const { res: res1 } = await contract.call("use_almost_equal", { a: 1n, b: 2 });
    expect(res1).to.deep.equal(1n); // 1 as in true
  });

  it("should handle rejected transactions", async function() {
    const contract = contractFactory.getContractAt(preservedAddress);

    const { res: balanceBeforeEven } = await contract.call("get_balance");

    // should pass
    await contract.invoke("increase_balance_with_even", { amount: 2n });

    const { res: balanceAfterEven } = await contract.call("get_balance");
    expect(balanceAfterEven).to.deep.equal(balanceBeforeEven + 2n);

    try {
      await contract.invoke("increase_balance_with_even", { amount: 3 });
      expect.fail("Should have failed on invoking with an odd number.");
    } catch (err: any) {
      expect(err.message).to.deep.equal("Transaction rejected.");
    }
  });

  it("should provide an expected address when a contract is deployed with salt", async function() {
    const EXPECTED_ADDRESS = "0x0479ace715103887f28e331401eb05bfe8c4bf3c3efa6943367c9e741f23297c";
    const addressSalt: string = "0x99";

    console.log("Started deployment");
    const contractFactory: StarknetContractFactory = await starknet.getContractFactory("contract");
    const contract: StarknetContract = await contractFactory.deploy({ initial_balance: 0 },addressSalt);
    console.log("Deployed at", contract.address);

    expect(contract.address).to.deep.equal(EXPECTED_ADDRESS);
  });
});
