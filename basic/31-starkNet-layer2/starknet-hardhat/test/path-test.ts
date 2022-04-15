import { expect } from "chai";
import { starknet } from "hardhat";
import { TIMEOUT } from "./constants";

const AMBIGUOUS_ERR_MSG = "More than one file was found because the path provided is ambiguous, please specify a relative path";

describe("getContractFactory", function() {
    this.timeout(TIMEOUT);

    it("should handle file name without extension", async function() {
        await starknet.getContractFactory("contract");
    });

    it("should handle file name with extension", async function() {
        await starknet.getContractFactory("contract.cairo");
    });

    it("should handle path without extension", async function() {
        await starknet.getContractFactory("contracts/contract");
    });

    it("should handle path with extension", async function() {
        await starknet.getContractFactory("contracts/contract.cairo");
    });

    it("should throw if name without extension ambiguous", async function() {
        try {
            await starknet.getContractFactory("util");
            expect.fail("Should have failed");
        } catch (err: any) {
            expect(err.message).to.equal(AMBIGUOUS_ERR_MSG);
        }

        await starknet.getContractFactory("contracts/util");
        await starknet.getContractFactory("contracts/submodule/util");
    });

    it("should throw if name with extension ambiguous", async function() {
        try {
            await starknet.getContractFactory("util.cairo");
            expect.fail("Should have failed");
        } catch (err: any) {
            expect(err.message).to.equal(AMBIGUOUS_ERR_MSG);
        }

        await starknet.getContractFactory("contracts/util.cairo");
        await starknet.getContractFactory("contracts/submodule/util.cairo");
    });
});
