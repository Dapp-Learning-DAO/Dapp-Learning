import { expect } from "chai";
import { starknet } from "hardhat";
import { TIMEOUT } from "./constants";
import { StarknetContract, StarknetContractFactory } from "hardhat/types/runtime";

describe("Starknet", function () {
  this.timeout(TIMEOUT);
  let contractFactory: StarknetContractFactory;
  let contract: StarknetContract;

  before(async function() {
    // assumes contract.cairo has been compiled
    contractFactory = await starknet.getContractFactory("contract");
    contract = await contractFactory.deploy({ initial_balance: 0 });
  });

  it("should work if provided number of arguments is the same as the expected", async function() {
    const { res: balanceBefore } = await contract.call("get_balance");
    expect(balanceBefore).to.deep.equal(0n);
  });

  it("should fail if provided number of arguments is less than the expected", async function() {
    try {
      await contract.call("sum_array");
      expect.fail("Should have failed on passing too few arguments.");
    } catch(err: any) {
      expect(err.message).to.equal("sum_array: Expected 1 argument, got 0.");
    }
  });

  it("should fail if provided number of arguments is more than the expected", async function() {
    try {
      await contract.call("sum_array", {a: [1, 2, 3, 4], b: 4 });
      expect.fail("Should have failed on passing extra argument.");
    } catch(err: any) {
      expect(err.message).to.equal("sum_array: Expected 1 argument, got 2.");
    }
  });

  it("should work if not providing the array length when having an array as argument", async function() {
    const { res: sum } = await contract.call("sum_array", {a: [1, 2, 3, 4] });
    expect(sum).to.deep.equal(10n);
  });

  it("should fail if providing the array length when having an array as argument", async function() {
    try {
      await contract.call("sum_array", {a_len: 4, a: [1, 2, 3, 4]});
      expect.fail("Should have failed on passing extra argument.");
    } catch(err: any) {
      expect(err.message).to.equal("sum_array: Expected 1 argument, got 2.");
    }
  });

  it("should work if providing the exact amount of members in a tuple, with the exact amount of members in a nested struct", async function() {
    const { res: sum } = await contract.call("sum_points_to_tuple", {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]
    });
    expect(sum).to.deep.equal([ 4n, 6n ]);
  });

  it("should fail if providing too many members in a tuple", async function() {
    try {
      await contract.call("sum_points_to_tuple", {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
          { x: 3, y: 4 }
        ]
      });
      expect.fail("Should have failed on passing more members than expected.");
    } catch(err: any) {
      expect(err.message).to.equal('"points": Expected 2 members, got 3.');
    }
  });

  it("should fail if providing too few members in a tuple", async function() {
    try {
      // passing Points (1, 2) and (3, 4) in a tuple
      await contract.call("sum_points_to_tuple", {
        points: [
          { x: 1, y: 2 }
        ]
      });
      expect.fail("Should have failed on passing less members than expected.");
    } catch(err: any) {
      expect(err.message).to.equal('"points": Expected 2 members, got 1.');
    }
  });

  it("should fail if providing too few members to a nested struct", async function() {
    try {
      // passing Points (1, 2) and (3, 4) in a tuple
      await contract.call("sum_points_to_tuple", {
        points: [
          { x: 1 },
          { x: 3, y: 4, z: 5 }
        ]
      });
      expect.fail("Should have failed on passing less members than expected.");
    } catch(err: any) {
      expect(err.message).to.equal('"points[0]": Expected 2 members, got 1.');
    }
  });

  it("should fail if providing too many members to a nested struct", async function() {
    try {
      // passing Points (1, 2) and (3, 4) in a tuple
      await contract.call("sum_points_to_tuple", {
        points: [
          { x: 1, y: 2},
          { x: 3, y: 4, z: 5 }
        ]
      });
      expect.fail("Should have failed on passing more members than expected");
    } catch(err: any) {
      expect(err.message).to.equal('"points[1]": Expected 2 members, got 3.');
    }
  });

});
